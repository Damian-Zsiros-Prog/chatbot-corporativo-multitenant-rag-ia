import { eq } from "drizzle-orm";
import type { SessionPayload } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { resolveDocumentFilePath } from "@/lib/documents/resolve-path";

export async function getDocumentForUser(
  session: SessionPayload,
  documentId: string,
) {
  const db = getDb();
  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  if (!doc) return null;

  if (doc.tenantId !== session.tenantId && session.role !== "super_admin") {
    return null;
  }

  const canRead =
    session.role === "super_admin" ||
    session.role === "admin_empresa" ||
    doc.allowedRoles.includes(session.role);

  if (!canRead) return null;

  const filePath = await resolveDocumentFilePath(doc);
  if (!filePath) {
    return { document: doc, filePath: null as string | null };
  }

  return { document: doc, filePath };
}
