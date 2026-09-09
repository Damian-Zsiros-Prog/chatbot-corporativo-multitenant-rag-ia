import { getSession, type SessionPayload } from "@/lib/auth/session";

export type AdminSession = SessionPayload & {
  role: "admin_empresa" | "super_admin";
};

export async function requireAdmin(): Promise<AdminSession | null> {
  const session = await getSession();
  if (!session) return null;
  if (session.role !== "admin_empresa" && session.role !== "super_admin") {
    return null;
  }
  return session as AdminSession;
}

export function canManageTenant(
  session: AdminSession,
  tenantId: string,
): boolean {
  if (session.role === "super_admin") return true;
  return session.tenantId === tenantId;
}
