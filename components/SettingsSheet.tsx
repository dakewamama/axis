"use client";

import { useRouter } from "next/navigation";
import { Sheet } from "@/components/Sheet";
import { useOnboarding } from "@/components/OnboardingProvider";
import { useLocation } from "@/components/LocationProvider";

const AUTH_LABEL: Record<string, string> = {
  google: "Google",
  apple: "Apple",
  email: "email",
};

/**
 * The account/settings hub, opened from the Axis logo on /home. Holds identity,
 * the places to edit collected state, wallet funding, and "Log out". Keeps
 * /home itself uncluttered.
 */
export function SettingsSheet({
  open,
  onClose,
  onAddMoney,
}: {
  open: boolean;
  onClose: () => void;
  onAddMoney: () => void;
}) {
  const router = useRouter();
  const { name, setName, email, authMethod, reset } = useOnboarding();
  const { reset: resetLocation } = useLocation();

  function go(path: string) {
    onClose();
    router.push(path);
  }

  // Sign out: clears local state + the session cookie. The account itself lives
  // server-side, so logging back in restores the profile and wallet.
  function logOut() {
    reset();
    resetLocation();
    router.replace("/auth");
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="px-5 pt-2.5 pb-1">
        <span className="block font-display text-2xl font-extrabold tracking-[-0.02em] text-ink">
          Settings
        </span>
        <span className="mt-1 block text-[12.5px] text-faint">
          {email
            ? `Signed in as ${email}.`
            : authMethod
              ? `Signed in with ${AUTH_LABEL[authMethod] ?? "your account"}.`
              : "Your Axis account."}
        </span>
      </div>

      <div className="px-5 pt-4">
        <label
          htmlFor="settings-name"
          className="mb-1.5 block text-[10px] font-bold tracking-[0.09em] text-faint uppercase"
        >
          Your name
        </label>
        <input
          id="settings-name"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 40))}
          placeholder="Add your name"
          className="mb-4 h-[50px] w-full rounded-2xl bg-white px-4 text-[16px] font-semibold text-ink shadow-card outline-none placeholder:font-normal placeholder:text-unfilled focus-visible:ring-2 focus-visible:ring-ink"
        />

        <div className="flex flex-col gap-2">
          <Row label="Manage services" onClick={() => go("/services")} />
          <Row label="Reach channels" onClick={() => go("/channels")} />
          <Row
            label="Add money"
            onClick={() => {
              onClose();
              onAddMoney();
            }}
          />
        </div>

        <button
          onClick={logOut}
          className="mt-5 mb-7 w-full rounded-full py-3.5 text-[13px] font-semibold text-red transition-colors hover:bg-red-tint focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
        >
          Log out
        </button>
      </div>
    </Sheet>
  );
}

function Row({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3.5 text-left shadow-card transition-colors hover:bg-red-tint focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
    >
      <span className="text-[15px] font-semibold text-ink">{label}</span>
      <span aria-hidden="true" className="text-faint">
        &rarr;
      </span>
    </button>
  );
}
