import { asc, eq } from "drizzle-orm";
import type { AdminSession } from "@/lib/admin/require-admin";
import { getDb } from "@/lib/db";
import { tenants, users } from "@/lib/db/schema";

export async function listTenantUsers(session: AdminSession) {
  const db = getDb();

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      tenantId: users.tenantId,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.tenantId, session.tenantId))
    .orderBy(asc(users.role), asc(users.email));

  return rows;
}

export async function listAllUsersForSuperAdmin(tenantId?: string) {
  const db = getDb();

  const query = db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      tenantId: users.tenantId,
      tenantName: tenants.name,
      tenantSlug: tenants.slug,
      createdAt: users.createdAt,
    })
    .from(users)
    .innerJoin(tenants, eq(users.tenantId, tenants.id))
    .orderBy(asc(tenants.name), asc(users.role), asc(users.email));

  if (tenantId) {
    return query.where(eq(users.tenantId, tenantId));
  }

  return query;
}
