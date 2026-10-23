"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AxisGlyph } from "@/components/AxisMark";
import { Bubble, TypingBubble } from "@/components/chat/Bubble";
import { useOnboarding } from "@/components/OnboardingProvider";
import { useGuard } from "@/components/useGuard";
import { useWallet } from "@/components/WalletProvider";
import { useLocation } from "@/components/LocationProvider";
import { NGN } from "@/lib/format";
import {
  type Card,
  type Message,
  repliesToMessages,
  placeHere,
  sendToBrain,
  userMessage,
} from "@/lib/chat";

// Airtime is the live vertical the brain fulfils end to end, so suggestions reflect
// what actually works (food/shop were removed in the architecture collapse).
const SUGGESTIONS = [
  "buy ₦200 MTN airtime for 08031234567",
  "buy ₦100 Glo airtime for 08051234567",
  "buy ₦500 Airtel airtime for 08021234567",
];

const MAX_INPUT = 512;

function clock(at: number): string {
  return new Date(at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Action =
  | { type: "append"; messages: Message[] }
  | { type: "replace"; messages: Message[] };

// Append-only during a session; `replace` is only used to restore saved history.
function reducer(state: Message[], action: Action): Message[] {
  switch (action.type) {
    case "append":
      return [...state, ...action.messages];
    case "replace":
      return action.messages;
  }
}

const CHAT_KEY = (webUserId: string) => `axis:chat:v1:${webUserId}`;
const NOTICES_KEY = (webUserId: string) => `axis:notices:v1:${webUserId}`;
const NOTICE_POLL_MS = 15000;
const MAX_SAVED = 60;

function ChatThread() {
  const router = useRouter();
  const params = useSearchParams();
  const seed = params.get("q")?.slice(0, 256).trim() ?? "";
  const tag = params.get("tag") ?? "";
  useGuard("complete", { preserveQuery: true });

  const { name, webUserId } = useOnboarding();
  const { balance } = useWallet();
  const { activeLabel, locateCurrent } = useLocation();

  const [messages, dispatch] = useReducer(reducer, []);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [chatHydrated, setChatHydrated] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const seeded = useRef(false);
  const firstName = name.trim() || "there";

  // Restore the saved thread once we know the user, so a reload keeps context.
  useEffect(() => {
    if (!webUserId || chatHydrated) return;
    try {
      const raw = localStorage.getItem(CHAT_KEY(webUserId));
      if (raw) {
        const saved = JSON.parse(raw) as Message[];
        if (Array.isArray(saved) && saved.length) {
          dispatch({ type: "replace", messages: saved });
        }
      }
    } catch {
      // ignore corrupt/unavailable storage
    }
    // Marks localStorage restoration done; runs once after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChatHydrated(true);
  }, [webUserId, chatHydrated]);

  // Persist the thread (capped) after hydration.
  useEffect(() => {
    if (!chatHydrated || !webUserId) return;
    try {
      localStorage.setItem(
        CHAT_KEY(webUserId),
        JSON.stringify(messages.slice(-MAX_SAVED)),
      );
    } catch {
      // storage full/blocked
    }
  }, [messages, chatHydrated, webUserId]);

  const send = useCallback(
    async (input: { text?: string; buttonId?: string; display: string }) => {
      dispatch({ type: "append", messages: [userMessage(input.display)] });
      setDraft("");
      setTyping(true);
      try {
        const replies = await sendToBrain({
          userId: webUserId,
          userName: name.trim() || undefined,
          text: input.text,
          buttonId: input.buttonId,
        });
        dispatch({ type: "append", messages: repliesToMessages(replies) });
      } catch {
        dispatch({
          type: "append",
          messages: repliesToMessages([
            {
              kind: "text",
              text: "I couldn't reach Axis just now. Give it a second and try again.",
            },
          ]),
        });
      } finally {
        setTyping(false);
      }
    },
    [webUserId, name],
  );

  /** "Location blink": precise fix (or a scanned tag), then the place card from brain. */
  const showPlace = useCallback(async (code?: string) => {
    setTyping(true);
    try {
      if (!code) {
        const error = await locateCurrent();
        if (error) {
          dispatch({ type: "append", messages: repliesToMessages([{ kind: "text", text: error }]) });
          return;
        }
      }
      dispatch({ type: "append", messages: repliesToMessages(await placeHere(code)) });
    } catch {
      dispatch({
        type: "append",
        messages: repliesToMessages([{ kind: "text", text: "I couldn't check where you are just now. Try again." }]),
      });
    } finally {
      setTyping(false);
    }
  }, [locateCurrent]);

  // Opened from a QR/NFC tag (/t/<code>): show that exact place and seat once.
  const tagged = useRef(false);
  useEffect(() => {
    if (tag && webUserId && chatHydrated && !tagged.current) {
      tagged.current = true;
      void showPlace(tag);
      router.replace("/chat");
    }
  }, [tag, webUserId, chatHydrated, showPlace, router]);

  function submitDraft() {
    const text = draft.trim();
    if (!text) return;
    send({ text, display: text });
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, typing]);

  // Payment updates (paid, failed, being checked) posted after the user last saw
  // them: shown in the thread as they arrive, each once per device.
  useEffect(() => {
    if (!webUserId || !chatHydrated) return;
    let since: string;
    try {
      since = localStorage.getItem(NOTICES_KEY(webUserId)) ?? new Date(Date.now() - 86400000).toISOString();
    } catch {
      since = new Date(Date.now() - 86400000).toISOString();
    }
    let stopped = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/notices?since=${encodeURIComponent(since)}`, { cache: "no-store" });
        if (!res.ok || stopped) return;
        const { notices } = (await res.json()) as { notices?: { text: string; at: string }[] };
        if (!notices?.length) return;
        since = notices[notices.length - 1]!.at;
        try {
          localStorage.setItem(NOTICES_KEY(webUserId), since);
        } catch {
          // storage blocked: updates may show again on this device
        }
        dispatch({ type: "append", messages: repliesToMessages(notices.map((n) => ({ kind: "text" as const, text: n.text }))) });
      } catch {
        // offline: try again next tick
      }
    };
    void poll();
    const timer = setInterval(() => void poll(), NOTICE_POLL_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [webUserId, chatHydrated]);

  // A ?q intent (home chip or shared link) is sent once the thread is hydrated,
  // then stripped from the URL so a reload doesn't replay it and the message text
  // doesn't linger in history. Works for returning users too (not just an empty
  // thread), so home chips always send.
  useEffect(() => {
    if (seed && webUserId && chatHydrated && !seeded.current) {
      seeded.current = true;
      send({ text: seed, display: seed });
      router.replace("/chat");
    }
  }, [seed, webUserId, chatHydrated, send, router]);

  const empty = messages.length === 0;

  return (
    <PhoneFrame>
      <div className="relative flex flex-1 animate-rise flex-col overflow-hidden bg-thread">
        <div className="flex shrink-0 items-center gap-3 bg-cream px-4 pt-2.5 pb-3 shadow-[0_1px_0_var(--color-line)]">
          <button
            onClick={() => router.push("/home")}
            aria-label="Back to home"
            className="px-0.5 py-1 text-xl leading-none text-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
          >
            &larr;
          </button>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink">
            <AxisGlyph size={21} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] leading-[1.1] font-bold text-ink">
              Axis
            </span>
            <span className="block text-[11px] text-faint">
              {typing ? "typing…" : "always on"}
            </span>
          </span>
          <span className="shrink-0 font-display text-[13px] font-extrabold text-ink">
            {NGN(balance)}
          </span>
        </div>

        <div
          ref={scrollRef}
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-4 pb-2"
        >
          <Bubble
            who="axis"
            text={`Hey ${firstName}, what can Axis do for you today?`}
            time=""
          />

          {messages.map((m) =>
            m.role === "user" ? (
              <Bubble key={m.id} who="user" text={m.text} time={clock(m.at)} />
            ) : "text" in m ? (
              <Bubble key={m.id} who="axis" text={m.text} time={clock(m.at)} />
            ) : (
              <CardView
                key={m.id}
                card={m.card}
                time={clock(m.at)}
                disabled={typing}
                onButton={(id, title) =>
                  id.startsWith("q:")
                    ? send({ text: title, display: title })
                    : send({ buttonId: id, display: title })
                }
                onShareLocation={() => {
                  dispatch({ type: "append", messages: [userMessage(`📍 ${activeLabel}`)] });
                  void showPlace();
                }}
              />
            ),
          )}

          {typing && <TypingBubble />}
        </div>

        {empty && !typing && (
          <div className="flex shrink-0 gap-2 overflow-x-auto px-4 pb-2.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send({ text: s, display: s })}
                className="shrink-0 rounded-full bg-white px-4 py-2.5 text-[12.5px] font-semibold whitespace-nowrap text-ink shadow-[0_1px_2px_rgb(32_30_29_/_0.1),0_6px_16px_-10px_rgb(32_30_29_/_0.25)] transition-colors hover:bg-red-tint focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex shrink-0 items-center gap-2.5 bg-thread px-3.5 pt-2.5 pb-3">
          <input
            value={draft}
            maxLength={MAX_INPUT}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitDraft();
              }
            }}
            placeholder="Ask Axis anything"
            aria-label="Message Axis"
            className="h-12 flex-1 rounded-full bg-white px-[18px] text-[16px] text-ink shadow-[0_1px_2px_rgb(32_30_29_/_0.1),0_6px_16px_-10px_rgb(32_30_29_/_0.22)] outline-none placeholder:text-faint focus-visible:ring-2 focus-visible:ring-ink"
          />
          <button
            onClick={submitDraft}
            disabled={!draft.trim()}
            aria-label="Send"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red text-[19px] text-white transition-all hover:bg-red-dark disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
          >
            &rarr;
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}

// Renders brain's structured replies: buttons and location_request.
function CardView({
  card,
  time,
  disabled,
  onButton,
  onShareLocation,
}: {
  card: Card;
  time: string;
  disabled: boolean;
  onButton: (id: string, title: string) => void;
  onShareLocation: () => void;
}) {
  if (card.kind === "location_request") {
    return (
      <div className="flex w-full flex-col items-start gap-1.5">
        <Bubble who="axis" text={card.text} time={time} />
        <button
          onClick={onShareLocation}
          disabled={disabled}
          className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-[13px] font-bold text-ink shadow-card transition-colors hover:bg-red-tint disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
        >
          📍 Share my location
        </button>
      </div>
    );
  }

  if (card.kind === "buttons") {
    return (
      <div className="flex w-full flex-col items-start gap-2">
        <Bubble who="axis" text={card.text} time={time} />
        <div className="ml-1 flex flex-wrap gap-2">
          {card.buttons.map((b) => (
            <button
              key={b.id}
              onClick={() => onButton(b.id, b.title)}
              disabled={disabled}
              className="rounded-full bg-white px-4 py-2.5 text-[13px] font-bold text-ink shadow-card transition-colors hover:bg-red-tint disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
            >
              {b.title}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // A card kind this version no longer sends (e.g. from a thread saved on this device): show its text.
  return <Bubble who="axis" text={(card as { text?: string }).text ?? ""} time={time} />;
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatThread />
    </Suspense>
  );
}
