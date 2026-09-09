import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { eq } from "drizzle-orm";
import type { Document } from "@/lib/db/schema";
import { getDb } from "@/lib/db";
import { tenants } from "@/lib/db/schema";

export async function resolveDocumentFilePath(
  doc: Document,
): Promise<string | null> {
  const db = getDb();
  const [tenant] = await db
    .select({ slug: tenants.slug })
    .from(tenants)
    .where(eq(tenants.id, doc.tenantId))
    .limit(1);

  if (!tenant) return null;

  return resolveDocumentFilePathSync(doc, tenant.slug);
}

export function resolveDocumentFilePathSync(
  doc: Document,
  tenantSlug: string,
): string | null {
  const candidates = [
    resolve(process.cwd(), doc.filePath),
    join(process.cwd(), "storage", "seed", tenantSlug, doc.fileName),
    join(process.cwd(), "storage", tenantSlug, doc.fileName),
    join(process.cwd(), "storage", "documents", tenantSlug, doc.fileName),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  return null;
}
