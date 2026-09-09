import { NextResponse } from "next/server";
import { z } from "zod";
import { createTenant } from "@/lib/admin/manage-tenant";
import { getTenantsOverview } from "@/lib/admin/tenant-overview";
import { requireSuperAdmin } from "@/lib/admin/require-super-admin";
import { isValidTenantSlug, normalizeTenantSlug } from "@/lib/admin/slug";

const createTenantSchema = z.object({
  slug: z.string().min(3).max(64),
  name: z.string().min(2).max(120),
  sector: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
});

export async function GET() {
  const session = await requireSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const tenants = await getTenantsOverview();
  return NextResponse.json({ tenants });
}

export async function POST(request: Request) {
  const session = await requireSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  try {
    const body = createTenantSchema.parse(await request.json());
    const slug = normalizeTenantSlug(body.slug);

    if (!isValidTenantSlug(slug)) {
      return NextResponse.json({ error: "Slug inválido" }, { status: 400 });
    }

    const tenant = await createTenant({
      slug,
      name: body.name,
      sector: body.sector,
      description: body.description,
    });

    return NextResponse.json({ tenant }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al crear empresa";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
