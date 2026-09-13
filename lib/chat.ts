// Mirror of brain's OutboundMessage contract (brain/src/core/types.ts). Kept in
// sync by hand; the /api/chat proxy passes these straight through untouched.

export type ReplyButton = { id: string; title: string };
export type ListRow = { id: string; title: string; description?: string };
export type ListSection = { title?: string; rows: ListRow[] };

export type OutboundMessage =
  | { kind: "text"; text: string }
  | { kind: "buttons"; text: string; buttons: ReplyButton[] }
  | { kind: "list"; text: string; header?: string; sections: ListSection[] }
  | { kind: "location_request"; text: string }
  | { kind: "link"; text: string; url: string; label?: string };

/** Any structured (non-plain-text) reply. */
export type Card = Exclude<OutboundMessage, { kind: "text" }>;

// A conversation is an append-only list of typed turns. Nothing is ever reset —
// asking a second thing keeps the first turn on screen.
export type Message =
  | { id: string; role: "user"; text: string; at: number }
  | { id: string; role: "axis"; text: string; at: number }
  | { id: string; role: "axis"; card: Card; at: number };

let seq = 0;
function mid(): string {
  return `${Date.now().toString(36)}-${(seq++).toString(36)}`;
}

export function userMessage(text: string): Message {
  return { id: mid(), role: "user", text, at: Date.now() };
}

/** Map each brain reply to one turn: plain text, or a structured card. */
export function repliesToMessages(replies: OutboundMessage[]): Message[] {
  return replies.map((r) =>
    r.kind === "text"
      ? ({ id: mid(), role: "axis", text: r.text, at: Date.now() } as Message)
      : ({ id: mid(), role: "axis", card: r, at: Date.now() } as Message),
  );
}

interface ChatResponse {
  replies?: OutboundMessage[];
}

/**
 * Talk to brain through our OWN same-origin proxy (/api/chat). The browser never
 * sees brain's URL — that lives in a server-only env var on the route handler.
 */
export async function sendToBrain(input: {
  userId: string;
  userName?: string;
  text?: string;
  buttonId?: string;
}): Promise<OutboundMessage[]> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`chat ${res.status}`);
  const data = (await res.json()) as ChatResponse;
  return data.replies ?? [];
}
