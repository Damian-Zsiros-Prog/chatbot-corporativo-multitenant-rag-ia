import Link from "next/link";
import type { SessionPayload } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/constants";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
};

function navForRole(role: SessionPayload["role"]): NavItem[] {
  if (role === "super_admin") {
    return [
      { href: "/admin/super", label: "Plataforma", exact: true },
      { href: "/admin/super/tenants", label: "Empresas" },
      { href: "/admin/super/users", label: "Usuarios" },
      { href: "/admin/super/documents", label: "Documentos" },
      { href: "/admin/super/evaluation", label: "Evaluación" },
      { href: "/admin/super/settings", label: "Configuración" },
    ];
  }

  return [
    { href: "/admin", label: "Dashboard", exact: true },
    { href: "/admin/documents", label: "Documentos" },
    { href: "/admin/users", label: "Usuarios" },
    { href: "/admin/analytics", label: "Analytics" },
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

type AdminShellProps = {
  session: SessionPayload;
  children: React.ReactNode;
};

export function AdminShell({ session, children }: AdminShellProps) {
  const navItems = navForRole(session.role);

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      <header className="border-b border-[var(--color-outline-variant)] bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 min-w-0">
            <Link href={navItems[0].href} className="font-semibold truncate">
              {APP_NAME}
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-1.5 text-sm rounded-md text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-on-surface)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {session.role !== "super_admin" && (
              <Link
                href="/chat"
                className="text-sm text-[var(--color-citation-text)] hidden md:inline"
              >
                Ir al chat
              </Link>
            )}
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium truncate max-w-[180px]">
                {session.name}
              </p>
              <p className="text-[10px] text-[var(--color-on-surface-variant)]">
                {roleLabel(session.role)}
                {session.role !== "super_admin" ? ` · ${session.tenantName}` : ""}
              </p>
            </div>
            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
