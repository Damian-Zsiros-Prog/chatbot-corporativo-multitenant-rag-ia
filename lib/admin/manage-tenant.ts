import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { isValidTenantSlug, normalizeTenantSlug } from "@/lib/admin/slug";
import { tenantDocumentsDir } from "@/lib/documents/storage";

export async function createTenant(input: {
  slug: string;
  name: string;
  sector: string;
  description?: string;
}) {
  const slug = normalizeTenantSlug(input.slug);
  if (!isValidTenantSlug(slug)) {
    throw new Error(
      "Slug inválido. Usa al menos 3 caracteres: letras minúsculas, números y guiones.",
    );
  }

  const db = getDb();
  const [existing] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  if (existing) {
    throw new Error(`Ya existe una empresa con slug "${slug}"`);
  }

  const [created] = await db
    .insert(tenants)
    .values({
      slug,
      name: input.name.trim(),
      sector: input.sector.trim(),
      description: input.description?.trim() || null,
    })
    .returning();

  tenantDocumentsDir(slug);

  return created;
}

export async function updateTenant(input: {
  slug: string;
  name?: string;
  sector?: string;
  description?: string | null;
}) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, input.slug))
    .limit(1);

  if (!existing) {
    throw new Error("Empresa no encontrada");
  }

  const [updated] = await db
    .update(tenants)
    .set({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.sector !== undefined ? { sector: input.sector.trim() } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
    })
    .where(eq(tenants.id, existing.id))
    .returning();

  return updated;
}

export async function deleteTenant(slug: string) {
  const db = getDb();
  const [existing] = await db
    .select({ id: tenants.id, slug: tenants.slug })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  if (!existing) {
    throw new Error("Empresa no encontrada");
  }

  const protectedSlugs = ["logistica-caribe", "hotel-bahia-dorada"];
  if (protectedSlugs.includes(existing.slug)) {
    throw new Error("No se pueden eliminar las empresas demo del proyecto");
  }

  await db.delete(tenants).where(eq(tenants.id, existing.id));
}
