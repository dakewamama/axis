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

export type Dish = {
  name: string;
  detail: string;
  price: number;
  flag?: string;
};

export const DISHES: Dish[] = [
  { name: "Peppered Wings", detail: "6 pieces · medium heat", price: 4500 },
  { name: "BBQ Honey Wings", detail: "8 pieces · sticky glaze", price: 6200, flag: "Most ordered" },
  { name: "Suya Wings Platter", detail: "12 pieces · shareable", price: 9400 },
  { name: "Grilled Chicken Half", detail: "with jollof rice", price: 7800 },
  { name: "Asun & Puff-Puff", detail: "smoked goat, small chops", price: 5600 },
];

export type Addon = {
  name: string;
  note: string;
  price: number;
};

export const ADDONS: Addon[] = [
  { name: "Fried plantain", note: "Sweet, 6 slices", price: 500 },
  { name: "Jollof rice", note: "Small portion", price: 1200 },
  { name: "Chilled Coke", note: "50cl bottle", price: 800 },
  { name: "Extra pepper sauce", note: "House ata din din", price: 300 },
];

export const FREE_DELIVERY_AT = 8000;
export const DELIVERY_FEE = 450;

export type Ride = {
  app: string;
  note: string;
  price: number;
  best?: boolean;
};

export const RIDES: Ride[] = [
  { app: "Rida", note: "4 min away · grey Corolla", price: 1850, best: true },
  { app: "inDrive", note: "6 min away · offer-based", price: 2100 },
  { app: "Bolt", note: "3 min away · surge active", price: 2940 },
];

export const RIDE_ROUTE = "Yaba → Victoria Island";

export const AIRTIME = {
  amount: 1000,
  line: "MTN airtime · 0803 445 1120",
  badge: "MTN · 0803 445 1120",
  ask: "Your usual top-up. Confirm and I'll load it.",
  done: "Done. ₦1,000 airtime loaded to 0803 445 1120 — MTN's confirmation SMS is on its way.",
};

export const BILL = {
  amount: 5200,
  line: "Ikeja Electric · prepaid token",
  badge: "Ikeja Electric · meter 4512 8890",
  ask: "Your outstanding balance is ₦5,200. Confirm and I'll settle it.",
  done: "Paid. ₦5,200 to Ikeja Electric, token sent below. Your meter should accept it right away.",
};