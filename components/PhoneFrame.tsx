import { StatusBar } from "./StatusBar";

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-cream lg:flex lg:min-h-dvh lg:items-center lg:justify-center lg:bg-stage lg:p-10">
      <main
        id="main-content"
        className="relative flex h-dvh w-full flex-col overflow-hidden bg-cream pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] lg:h-[844px] lg:w-[390px] lg:rounded-[44px] lg:pt-0 lg:pb-0 lg:shadow-phone"
      >
        {children}
      </main>
    </div>
  );
}