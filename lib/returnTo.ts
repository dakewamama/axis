// Where to land after sign-in when a deep link (e.g. an approval link from
// ChatGPT) needed the user to sign in first. Only known in-app paths are kept.
const KEY = "axis:return-to";
const ALLOWED = /^\/(approve\/[0-9a-f-]{36}|vault|activity|recurring|permissions|place(\?tag=[A-Za-z0-9_-]{16,64})?|pay(\?to=[0-9a-f-]{36})?)$/;

export function rememberReturnTo(path: string) {
  if (!ALLOWED.test(path)) return;
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    // storage blocked: the user lands on /home instead
  }
}

/** The remembered path (cleared once read), or the fallback. */
export function takeReturnTo(fallback: string): string {
  try {
    const path = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (path && ALLOWED.test(path)) return path;
  } catch {
    // ignore
  }
  return fallback;
}
