"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";

const navLinks = [
  { href: "#producto", label: "Producto" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#empresas", label: "Para empresas" },
];

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      <header className="relative z-20 border-b border-[var(--color-outline-variant)]/60 bg-white/70 backdrop-blur-md safe-top">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Link href="/" className="shrink-0">
            <Logo size="sm" />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-[var(--color-on-surface-variant)]">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-[var(--color-citation-text)]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--color-citation-text)] hover:underline px-2"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/login"
              className="hidden sm:inline-flex h-10 items-center rounded-xl bg-[var(--color-inverse-surface)] px-4 text-sm font-medium text-[var(--color-inverse-on-surface)] hover:opacity-90 transition-opacity"
            >
              Solicitar demo
            </Link>
            <button
              type="button"
              className="md:hidden min-h-[44px] min-w-[44px] rounded-lg border border-[var(--color-outline-variant)] flex items-center justify-center"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <>
          <button
            type="button"
            aria-label="Cerrar menú"
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={closeMenu}
          />
          <aside className="fixed top-0 right-0 bottom-0 z-50 w-[min(100vw,20rem)] flex flex-col bg-white border-l border-[var(--color-outline-variant)] shadow-xl md:hidden safe-top safe-bottom">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-outline-variant)]">
              <Logo size="sm" />
              <button
                type="button"
                onClick={closeMenu}
                className="min-h-[44px] min-w-[44px] rounded-lg hover:bg-[var(--color-surface-container-low)]"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className="flex min-h-[44px] items-center rounded-xl px-4 text-sm font-medium hover:bg-[var(--color-surface-container-low)]"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="p-4 border-t border-[var(--color-outline-variant)] space-y-2">
              <Link
                href="/login"
                onClick={closeMenu}
                className="flex h-11 items-center justify-center rounded-xl bg-[var(--color-secondary)] text-sm font-semibold text-white"
              >
                Solicitar demo
              </Link>
              <Link
                href="/login"
                onClick={closeMenu}
                className="flex h-11 items-center justify-center rounded-xl border border-[var(--color-outline-variant)] text-sm font-medium"
              >
                Iniciar sesión
              </Link>
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
