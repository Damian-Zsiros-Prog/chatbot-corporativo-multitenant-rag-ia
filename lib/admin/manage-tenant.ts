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
