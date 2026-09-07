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
// chips for services the user actually selected in onboarding to the front. Chips
// with no vertical (e.g. shopping) are always available.
export type Shortcut = { prompt: string; vertical?: number };

export const HOME_SHORTCUTS: Shortcut[] = [
  { prompt: "does nadia have chicken wings", vertical: 0 }, // Food delivery
  { prompt: "send suya to my mum in surulere", vertical: 3 }, // Send a package
  { prompt: "order jollof for two", vertical: 0 },
  { prompt: "buy an oraimo powerbank" }, // shopping
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
