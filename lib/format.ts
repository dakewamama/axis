export const NGN = (n: number) => "₦" + n.toLocaleString("en-NG");

/** Axis shows times in Lagos time everywhere, matching the messages brain writes. */
const LAGOS = "Africa/Lagos";

export function lagosTime(iso: string, withWeekday = false): string {
  return new Date(iso).toLocaleString("en-NG", {
    timeZone: LAGOS,
    ...(withWeekday ? { weekday: "short" as const } : {}),
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatPhone(digits: string) {
  const d = digits.slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

export function relativeDay(at: number) {
  const days = Math.floor((Date.now() - at) / 864e5);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(at).toLocaleDateString("en-NG", {
    timeZone: LAGOS,
    day: "numeric",
    month: "short",
  });
}