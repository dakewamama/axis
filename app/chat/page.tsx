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
  sendToBrain,
  userMessage,
} from "@/lib/chat";

// Supported verticals only — delivery, gifting, shopping. Rides, airtime and
// bills are not backed by brain, so they are not suggested here.
const SUGGESTIONS = [
  "does nadia have chicken wings",
  "send suya to my mum in surulere",
  "buy an oraimo powerbank",
];

const MAX_INPUT = 512;

function clock(at: number): string {
  return new Date(at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Action = { type: "append"; messages: Message[] };

// Append-only. Nothing here ever clears the thread.
function reducer(state: Message[], action: Action): Message[] {
  switch (action.type) {
    case "append":
      return [...state, ...action.messages];
  }
}

function ChatThread() {
  const router = useRouter();
  const params = useSearchParams();
  const seed = params.get("q")?.slice(0, 256).trim() ?? "";
  useGuard("complete", { preserveQuery: true });

  const { name, webUserId } = useOnboarding();
  const { balance } = useWallet();
  const { activeLabel, activeDetail } = useLocation();

  const [messages, dispatch] = useReducer(reducer, []);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const seeded = useRef(false);
  const firstName = name.trim() || "there";

  const send = useCallback(
    async (input: { text?: string; buttonId?: string; display: string }) => {
      dispatch({ type: "append", messages: [userMessage(input.display)] });
      setDraft("");
      setTyping(true);
      try {
        const replies = await sendToBrain({
          userId: webUserId,
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
    [webUserId],
  );

  function submitDraft() {
    const text = draft.trim();
    if (!text) return;
    send({ text, display: text });
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, typing]);

  // A shared link (?q) starts the conversation once webUserId is ready.
  useEffect(() => {
    if (seed && webUserId && !seeded.current) {
      seeded.current = true;
      send({ text: seed, display: seed });
    }
  }, [seed, webUserId, send]);

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
            text={`Hi ${firstName}. I'm Axis.\n\nTell me what you need in plain words — order food, send a gift, or shop. No menus.`}
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
                  send({ buttonId: id, display: title })
                }
                onShareLocation={() =>
                  send({
                    text: activeDetail || activeLabel,
                    display: `📍 ${activeLabel}`,
                  })
                }
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

// Renders brain's structured replies: buttons, list, location_request, link.
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
  if (card.kind === "link") {
    return (
      <div className="flex w-full flex-col items-start gap-1.5">
        <Bubble who="axis" text={card.text} time={time} />
        <a
          href={card.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-[13px] font-bold text-cream transition-colors hover:bg-red focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
        >
          {card.label ?? "Open"} <span aria-hidden="true">↗</span>
        </a>
      </div>
    );
  }

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

  // list
  return (
    <div className="flex w-full flex-col items-start gap-2">
      <Bubble who="axis" badge={card.header} text={card.text} time={time} />
      <div className="ml-1 flex w-[80%] flex-col gap-1.5">
        {card.sections.flatMap((section) =>
          section.rows.map((row) => (
            <button
              key={row.id}
              onClick={() => onButton(row.id, row.title)}
              disabled={disabled}
              className="w-full rounded-2xl bg-white p-3 text-left shadow-card transition-colors hover:bg-red-tint disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
            >
              <span className="block text-[14px] font-bold text-ink">
                {row.title}
              </span>
              {row.description && (
                <span className="mt-0.5 block text-[12px] text-faint">
                  {row.description}
                </span>
              )}
            </button>
          )),
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatThread />
    </Suspense>
  );
}
