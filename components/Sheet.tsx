"use client";

import { useEffect } from "react";

export function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-50 flex flex-col justify-end bg-ink/50"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className="max-h-[90%] animate-sheet overflow-y-auto rounded-t-[28px] bg-cream shadow-[0_-20px_50px_-20px_rgb(32_30_29_/_0.5)]"
      >
        <div className="flex justify-center pt-2.5 pb-0.5">
          <span className="h-1 w-[38px] rounded-full bg-handle" />
        </div>
        {children}
      </div>
    </div>
  );
}