import { NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteTenantUser,
  updateTenantUser,
} from "@/lib/admin/manage-user";
import { TENANT_ASSIGNABLE_ROLES } from "@/lib/admin/roles";
import { requireAdmin } from "@/lib/admin/require-admin";

type RouteContext = { params: Promise<{ id: string }> };

const updateUserSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  role: z.enum(TENANT_ASSIGNABLE_ROLES).optional(),
  password: z.string().min(6).max(128).optional(),
});

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const body = updateUserSchema.parse(await request.json());
    const user = await updateTenantUser({
      session,
      userId: id,
      ...body,
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.flatten() },
        { status: 400 },
      );
    }
    const message =
      error instanceof Error ? error.message : "Error al actualizar usuario";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    await deleteTenantUser({ session, userId: id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al eliminar usuario";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
