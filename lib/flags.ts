// Test bypass. When NEXT_PUBLIC_SKIP_ONBOARDING=1, the onboarding flow and its
// route guards are skipped and a throwaway identity is seeded, so an agent (or a
// tester) lands straight on /home and /chat with a working session. OFF by
// default — real production keeps the full auth → name → channels flow.
export const SKIP_ONBOARDING =
  process.env.NEXT_PUBLIC_SKIP_ONBOARDING === "1";
