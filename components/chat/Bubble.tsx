export function Bubble({
  who,
  text,
  time,
}: {
  who: "user" | "axis";
  text: string;
  time: string;
}) {
  const isUser = who === "user";

  return (
    <div
      className={`flex w-full flex-col ${isUser ? "items-end" : "items-start"}`}
      style={{ animation: "rise 0.28s cubic-bezier(0.2,0.8,0.2,1) both" }}
    >
      <div
        className={`max-w-[80%] px-4 pt-3 pb-2.5 shadow-bubble ${
          isUser
            ? "rounded-[22px_22px_6px_22px] bg-ink text-cream"
            : "rounded-[22px_22px_22px_6px] bg-white text-ink"
        }`}
      >
        <div className="text-[14.5px] leading-[1.5] whitespace-pre-line text-pretty">
          {text}
        </div>
        {time && (
          <div className="mt-1.5 text-right text-[10px] opacity-50">{time}</div>
        )}
      </div>
    </div>
  );
}

export function TypingBubble() {
  return (
    <div className="flex gap-1.5 self-start rounded-[20px_20px_20px_6px] bg-white px-4 py-3.5 shadow-bubble">
      <span className="h-1.5 w-1.5 animate-dot rounded-full bg-ink" />
      <span
        className="h-1.5 w-1.5 animate-dot rounded-full bg-ink"
        style={{ animationDelay: "0.18s" }}
      />
      <span
        className="h-1.5 w-1.5 animate-dot rounded-full bg-ink"
        style={{ animationDelay: "0.36s" }}
      />
    </div>
  );
}