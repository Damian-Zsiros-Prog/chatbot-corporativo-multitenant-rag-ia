"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { SessionPayload } from "@/lib/auth/session";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { Logo } from "@/components/brand/logo";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import {
  IconAnalytics,
  IconBuilding,
  IconChat,
  IconDashboard,
  IconDocuments,
  IconEvaluation,
  IconSettings,
  IconUsers,
} from "@/components/brand/nav-icons";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
};

function navForRole(role: SessionPayload["role"]): NavItem[] {
  if (role === "super_admin") {
    return [
      { href: "/admin/super", label: "Dashboard", icon: <IconDashboard />, exact: true },
      { href: "/admin/super/tenants", label: "Empresas", icon: <IconBuilding /> },
      { href: "/admin/super/users", label: "Usuarios", icon: <IconUsers /> },
      { href: "/admin/super/documents", label: "Documentos", icon: <IconDocuments /> },
      { href: "/admin/super/evaluation", label: "Evaluación", icon: <IconEvaluation /> },
      { href: "/admin/super/analytics", label: "Analytics", icon: <IconAnalytics /> },
      { href: "/admin/super/settings", label: "Configuración", icon: <IconSettings /> },
    ];
  }

  return [
    { href: "/admin", label: "Dashboard", icon: <IconDashboard />, exact: true },
    { href: "/admin/documents", label: "Documentos", icon: <IconDocuments /> },
    { href: "/admin/users", label: "Usuarios", icon: <IconUsers /> },
    { href: "/admin/analytics", label: "Analytics", icon: <IconAnalytics /> },
  ];
}

function roleLabel(role: SessionPayload["role"]): string {
  switch (role) {
    case "super_admin":
      return "Super administrador";
    case "admin_empresa":
      return "Admin de empresa";
    default:
      return role;
  }
}

function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function currentPageLabel(pathname: string, navItems: NavItem[]): string {
  const match = navItems.find((item) => isActive(pathname, item));
  return match?.label ?? "Admin";
}

type AdminShellProps = {
  session: SessionPayload;
  children: React.ReactNode;
};

export function AdminShell({ session, children }: AdminShellProps) {
  const pathname = usePathname();
  const navItems = navForRole(session.role);
  const homeHref = navItems[0].href;
  const [menuOpen, setMenuOpen] = useState(false);
  const pageLabel = currentPageLabel(pathname, navItems);

  const navLinks = (
    <>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMenuOpen(false)}
          className={`sidebar-nav-item ${
            isActive(pathname, item) ? "sidebar-nav-item-active" : ""
          }`}
        >
          {item.icon}
          {item.label}
        </Link>
      ))}
    </>
  );

  return (
    <div className="min-h-dvh bg-[var(--color-background)] flex">
      <aside className="hidden lg:flex flex-col w-[var(--admin-sidebar-width)] shrink-0 border-r border-[var(--color-outline-variant)] bg-white min-h-dvh sticky top-0">
        <div className="p-5 border-b border-[var(--color-outline-variant)]">
          <Link href={homeHref}>
            <Logo size="sm" />
          </Link>
          <p className="text-[11px] text-[var(--color-on-surface-variant)] mt-2">
            {APP_TAGLINE}
          </p>
        </div>

        <div className="p-4 border-b border-[var(--color-outline-variant)]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] flex items-center justify-center font-semibold text-sm">
              {session.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{session.name}</p>
              <p className="text-[11px] text-[var(--color-on-surface-variant)] truncate">
                {session.email}
              </p>
            </div>
          </div>
          <p className="text-[10px] text-[var(--color-on-surface-variant)] mt-2">
            {roleLabel(session.role)}
            {session.role !== "super_admin" ? ` · ${session.tenantName}` : ""}
          </p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">{navLinks}</nav>

        <div className="p-3 border-t border-[var(--color-outline-variant)] space-y-1">
          <Link href="/chat" className="sidebar-nav-item">
            <IconChat />
            Ir al chat
          </Link>
          <div className="px-3 pt-2">
            <AdminLogoutButton />
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 sm:h-16 border-b border-[var(--color-outline-variant)] bg-white/80 backdrop-blur-sm sticky top-0 z-10 px-4 md:px-6 flex items-center justify-between gap-3 safe-top">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              className="lg:hidden min-h-[44px] min-w-[44px] rounded-lg border border-[var(--color-outline-variant)] flex items-center justify-center shrink-0"
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
            <div className="min-w-0 lg:hidden">
              <p className="text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-wide">
                {APP_NAME}
              </p>
              <p className="text-sm font-semibold truncate">{pageLabel}</p>
            </div>
            <div className="hidden lg:block">
              <p className="text-label-sm text-[var(--color-on-surface-variant)]">
                Back-office
              </p>
              <p className="text-sm font-semibold">{APP_NAME}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/chat"
              className="hidden sm:inline-flex h-9 items-center rounded-lg px-3 text-xs font-medium text-[var(--color-citation-text)] border border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-low)]"
            >
              Chat
            </Link>
            <div className="text-right hidden md:block max-w-[10rem]">
              <p className="text-xs font-medium truncate">{session.name}</p>
              <p className="text-[10px] text-[var(--color-on-surface-variant)] truncate">
                {session.tenantName}
              </p>
            </div>
            <div className="lg:hidden">
              <AdminLogoutButton />
            </div>
          </div>
        </header>

        <MobileDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          title="Navegación"
          side="left"
        >
          <div className="flex flex-col h-full overflow-y-auto">
            <div className="p-4 border-b border-[var(--color-outline-variant)]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] flex items-center justify-center font-semibold text-sm">
                  {session.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{session.name}</p>
                  <p className="text-[11px] text-[var(--color-on-surface-variant)] truncate">
                    {session.email}
                  </p>
                </div>
              </div>
            </div>
            <nav className="flex-1 p-3 space-y-1">{navLinks}</nav>
            <div className="p-3 border-t border-[var(--color-outline-variant)] space-y-1">
              <Link
                href="/chat"
                onClick={() => setMenuOpen(false)}
                className="sidebar-nav-item"
              >
                <IconChat />
                Ir al chat
              </Link>
            </div>
          </div>
        </MobileDrawer>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
