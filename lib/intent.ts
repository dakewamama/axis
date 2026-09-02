export type Intent = "food" | "ride" | "airtime" | "bill";

export function detectIntent(text: string): Intent {
  const s = (text || "").toLowerCase();
  if (/\b(ride|taxi|bolt|indrive|rida|pick ?up|drop|take me|go to)\b/.test(s))
    return "ride";
  if (/\b(airtime|data|top ?up|recharge|mtn|glo|airtel|9mobile)\b/.test(s))
    return "airtime";
  if (/\b(bill|electric|ikeja|nepa|dstv|prepaid|meter|subscription)\b/.test(s))
    return "bill";
  return "food";
}