"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

type MobileDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: "left" | "right";
  /** Breakpoint above which the drawer is hidden (default: lg) */
  hideAbove?: "lg" | "xl";
  children: React.ReactNode;
};

const hideAboveClass = {
  lg: "lg:hidden",
  xl: "xl:hidden",
} as const;

export function MobileDrawer({
  open,
  onClose,
  title,
  side = "left",
  hideAbove = "lg",
  children,
}: MobileDrawerProps) {
  const hiddenClass = hideAboveClass[hideAbove];

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  const widthVar =
    side === "left" ? "var(--drawer-max-width)" : "var(--inspector-drawer-max-width)";

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar panel"
        className={`fixed inset-0 z-40 bg-black/50 ${hiddenClass}`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-14 bottom-0 z-50 flex flex-col overflow-hidden border-[var(--color-outline-variant)] bg-white shadow-xl safe-bottom ${hiddenClass} ${
          side === "left" ? "left-0 border-r" : "right-0 border-l"
        }`}
        style={{ width: widthVar, maxWidth: "100vw" }}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-outline-variant)] p-4">
          <p className="text-sm font-semibold truncate pr-2">{title}</p>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar">
            ✕
          </Button>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">{children}</div>
      </aside>
    </>
  );
}
