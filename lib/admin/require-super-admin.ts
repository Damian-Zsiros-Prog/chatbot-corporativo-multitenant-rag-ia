import { getSession, type SessionPayload } from "@/lib/auth/session";

export type SuperAdminSession = SessionPayload & { role: "super_admin" };

export async function requireSuperAdmin(): Promise<SuperAdminSession | null> {
  const session = await getSession();
  if (!session || session.role !== "super_admin") return null;
  return session as SuperAdminSession;
}
