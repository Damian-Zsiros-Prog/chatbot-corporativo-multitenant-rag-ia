import { and, eq } from "drizzle-orm";
import type { AdminSession } from "@/lib/admin/require-admin";
import { canManageTenant } from "@/lib/admin/require-admin";
import { hashPassword } from "@/lib/auth/password";
import { getDb } from "@/lib/db";
import { tenants, users, type UserRole } from "@/lib/db/schema";
import {
  isTenantAssignableRole,
  type TenantAssignableRole,
} from "@/lib/admin/roles";

export async function createTenantUser(input: {
  session: AdminSession;
  tenantId: string;
  name: string;
  email: string;
  password: string;
  role: TenantAssignableRole;
}) {
  if (!canManageTenant(input.session, input.tenantId)) {
    throw new Error("Sin permisos para esta empresa");
  }

  if (!isTenantAssignableRole(input.role)) {
    throw new Error("Rol no permitido");
  }

  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) {
    throw new Error("Email inválido");
  }

  if (input.password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres");
  }

  const db = getDb();
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.tenantId, input.tenantId), eq(users.email, email)))
    .limit(1);

  if (existing) {
    throw new Error("Ya existe un usuario con ese email en esta empresa");
  }

  const passwordHash = await hashPassword(input.password);
  const [created] = await db
    .insert(users)
    .values({
      tenantId: input.tenantId,
      email,
      name: input.name.trim(),
      passwordHash,
      role: input.role as UserRole,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      tenantId: users.tenantId,
      createdAt: users.createdAt,
    });

  return created;
}

export async function resolveTenantIdForAdmin(
  session: AdminSession,
  tenantSlug?: string,
): Promise<string> {
  if (session.role === "admin_empresa") {
    return session.tenantId;
  }

  if (!tenantSlug) {
    throw new Error("Empresa requerida");
  }

  const db = getDb();
  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);

  if (!tenant) {
    throw new Error("Empresa no encontrada");
  }

  return tenant.id;
}
