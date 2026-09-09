import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const STORAGE_ROOT =
  process.env.STORAGE_PATH ?? join(process.cwd(), "storage");

export function tenantDocumentsDir(tenantSlug: string): string {
  const dir = join(STORAGE_ROOT, "documents", tenantSlug);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function saveTenantDocument(
  tenantSlug: string,
  fileName: string,
  content: string | Buffer,
): string {
  const dir = tenantDocumentsDir(tenantSlug);
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const absolutePath = join(dir, safeName);
  writeFileSync(absolutePath, content);
  return resolve(absolutePath);
}

export function deleteDocumentFile(filePath: string): void {
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
}
