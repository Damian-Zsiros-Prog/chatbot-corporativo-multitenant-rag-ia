import { NextResponse } from "next/server";
import { z } from "zod";
import {
  listAllUsersForSuperAdmin,
  listTenantUsers,
} from "@/lib/admin/list-users";
import {
  createTenantUser,
  resolveTenantIdForAdmin,
} from "@/lib/admin/manage-user";
import { TENANT_ASSIGNABLE_ROLES } from "@/lib/admin/roles";
import { requireAdmin } from "@/lib/admin/require-admin";

const createUserSchema = z.object({
  tenantSlug: z.string().min(1).optional(),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  role: z.enum(TENANT_ASSIGNABLE_ROLES),
});

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get("tenantSlug") ?? undefined;

  if (session.role === "super_admin") {
    let tenantId: string | undefined;
    if (tenantSlug) {
      tenantId = await resolveTenantIdForAdmin(session, tenantSlug);
    }
    const users = await listAllUsersForSuperAdmin(tenantId);
    return NextResponse.json({ users });
  }

  const users = await listTenantUsers(session);
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  try {
    const body = createUserSchema.parse(await request.json());
    const tenantId = await resolveTenantIdForAdmin(session, body.tenantSlug);

    const user = await createTenantUser({
      session,
      tenantId,
      name: body.name,
      email: body.email,
      password: body.password,
      role: body.role,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.flatten() },
        { status: 400 },
      );
    }
    const message =
      error instanceof Error ? error.message : "Error al crear usuario";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
