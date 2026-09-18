export type Vertical = {
  label: string;
  note: string;
  waitlist?: boolean;
};

export const VERTICALS: Vertical[] = [
  { label: "Food delivery", note: "Restaurants near you, ordered by chat" },
  { label: "Rides", note: "Cheapest of Bolt, inDrive and Rida" },
  { label: "Bills & airtime", note: "Power, data, TV, top-ups" },
  { label: "Send a package", note: "Errands and same-day drop-offs" },
  { label: "Money transfer & cash out", note: "Send naira, withdraw to bank" },
  { label: "Flights & interstate travel", note: "Domestic routes and bus seats" },
  { label: "Event & cinema tickets", note: "Book and hold seats in chat" },
  { label: "Groceries & market runs", note: "Weekly lists, one message", waitlist: true },
  { label: "Pharmacy & health", note: "Prescriptions and refills", waitlist: true },
];

// Home suggestion chips. `vertical` (index into VERTICALS) lets /home float the
// chips for services the user selected in onboarding. Airtime is the live vertical
// today, so the chips reflect what actually works end to end (index 2 = airtime).
export type Shortcut = { prompt: string; vertical?: number };

export const HOME_SHORTCUTS: Shortcut[] = [
  { prompt: "buy ₦200 airtime for 08012345678", vertical: 2 },
  { prompt: "buy ₦500 MTN airtime", vertical: 2 },
  { prompt: "top up 08051234567 with ₦100", vertical: 2 },
];

export type Channel = {
  label: string;
  note: string;
  kind: "primary" | "optional" | "soon";
};

export const CHANNELS: Channel[] = [
  { label: "Axis app", note: "This app. Fastest, richest replies.", kind: "primary" },
  { label: "WhatsApp", note: "Chat Axis from your existing contacts", kind: "optional" },
  { label: "Telegram", note: "Mirror of the same account", kind: "optional" },
  { label: "Voice & USSD", note: "For when data is down", kind: "soon" },
];
