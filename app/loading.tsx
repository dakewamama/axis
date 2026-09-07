import { PhoneFrame } from "@/components/PhoneFrame";
import { AxisMark } from "@/components/AxisMark";

export default function Loading() {
  return (
    <PhoneFrame>
      <main className="flex flex-1 items-center justify-center">
        <div className="animate-pulse">
          <AxisMark size={52} radius={17} glyph={30} />
        </div>
      </main>
    </PhoneFrame>
  );
}
