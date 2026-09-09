import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteTenant, updateTenant } from "@/lib/admin/manage-tenant";
import { requireSuperAdmin } from "@/lib/admin/require-super-admin";

type RouteContext = { params: Promise<{ slug: string }> };

const updateTenantSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  sector: z.string().min(2).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
});

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const { slug } = await context.params;

  try {
    const body = updateTenantSchema.parse(await request.json());
    const tenant = await updateTenant({ slug, ...body });
    return NextResponse.json({ tenant });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.flatten() },
        { status: 400 },
      );
    }
    const message =
      error instanceof Error ? error.message : "Error al actualizar empresa";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const { slug } = await context.params;

  try {
    await deleteTenant(slug);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al eliminar empresa";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
