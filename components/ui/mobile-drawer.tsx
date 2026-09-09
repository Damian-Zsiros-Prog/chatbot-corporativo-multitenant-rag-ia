"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

type MobileDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: "left" | "right";
  children: React.ReactNode;
};

export function MobileDrawer({
  open,
  onClose,
  title,
  side = "left",
  children,
}: MobileDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar panel"
        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        onClick={onClose}
      />
      <aside
        className={`fixed top-14 bottom-0 z-50 flex w-[min(100%,320px)] flex-col overflow-hidden border-[var(--color-outline-variant)] bg-white shadow-xl lg:hidden ${
          side === "left" ? "left-0 border-r" : "right-0 border-l"
        }`}
        style={
          side === "left"
            ? { width: "var(--sidebar-width, 280px)" }
            : { width: "var(--inspector-width, 320px)" }
        }
      >
        <div className="flex items-center justify-between border-b border-[var(--color-outline-variant)] p-4">
          <p className="text-sm font-semibold">{title}</p>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar">
            ✕
          </Button>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">{children}</div>
      </aside>
    </>
  );
}
