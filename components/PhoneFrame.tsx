import { StatusBar } from "./StatusBar";

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-cream lg:flex lg:items-center lg:justify-center lg:bg-stage lg:p-10">
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-cream lg:h-[844px] lg:w-[390px] lg:rounded-[44px] lg:shadow-phone">
        <StatusBar />
        {children}
        <div className="hidden shrink-0 justify-center pt-2 pb-2.5 lg:flex">
          <span className="h-1 w-[120px] rounded-full bg-ink opacity-30" />
        </div>
      </div>
    </div>
  );
}