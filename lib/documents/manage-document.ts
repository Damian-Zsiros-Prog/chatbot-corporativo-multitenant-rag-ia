import { eq } from "drizzle-orm";
import { tenants } from "@/lib/db/schema";
import type { AdminSession } from "@/lib/admin/require-admin";
import { canManageTenant } from "@/lib/admin/require-admin";
import { getDb } from "@/lib/db";
import {
  documents,
  type DocumentCategory,
  type UserRole,
} from "@/lib/db/schema";
import { deleteDocumentFile } from "@/lib/documents/storage";
import { ingestDocument } from "@/lib/ingestion/ingest-document";

export async function listTenantDocuments(session: AdminSession) {
  const db = getDb();

  if (session.role === "super_admin") {
    return db
      .select({
        id: documents.id,
        tenantId: documents.tenantId,
        title: documents.title,
        category: documents.category,
        fileName: documents.fileName,
        filePath: documents.filePath,
        mimeType: documents.mimeType,
        sectionRef: documents.sectionRef,
        description: documents.description,
        allowedRoles: documents.allowedRoles,
        status: documents.status,
        chunkCount: documents.chunkCount,
        errorMessage: documents.errorMessage,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
      })
      .from(documents)
      .innerJoin(tenants, eq(documents.tenantId, tenants.id));
  }

  return db
    .select()
    .from(documents)
    .where(eq(documents.tenantId, session.tenantId));
}

export async function createDocument(input: {
  session: AdminSession;
  tenantId: string;
  tenantSlug: string;
  title: string;
  category: DocumentCategory;
  sectionRef?: string;
  description?: string;
  allowedRoles: UserRole[];
  fileName: string;
  filePath: string;
}) {
  if (!canManageTenant(input.session, input.tenantId)) {
    throw new Error("Sin permisos para esta empresa");
  }

  const db = getDb();
  const [created] = await db
    .insert(documents)
    .values({
      tenantId: input.tenantId,
      title: input.title,
      category: input.category,
      fileName: input.fileName,
      filePath: input.filePath,
      sectionRef: input.sectionRef ?? null,
      description: input.description ?? null,
      allowedRoles: input.allowedRoles,
      status: "queued",
      mimeType: "text/markdown",
    })
    .returning();

  const chunkCount = await ingestDocument(created.id);
  const [updated] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, created.id))
    .limit(1);

  return { document: updated ?? created, chunkCount };
}

export async function reindexDocument(
  session: AdminSession,
  documentId: string,
) {
  const db = getDb();
  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  if (!doc || !canManageTenant(session, doc.tenantId)) {
    throw new Error("Documento no encontrado");
  }

  const chunkCount = await ingestDocument(documentId);
  const [updated] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  return { document: updated!, chunkCount };
}

export async function removeDocument(
  session: AdminSession,
  documentId: string,
) {
  const db = getDb();
  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  if (!doc || !canManageTenant(session, doc.tenantId)) {
    throw new Error("Documento no encontrado");
  }

  deleteDocumentFile(doc.filePath);
  await db.delete(documents).where(eq(documents.id, documentId));
  return { ok: true };
}

export async function getDocumentForAdmin(
  session: AdminSession,
  documentId: string,
) {
  const db = getDb();
  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  if (!doc || !canManageTenant(session, doc.tenantId)) {
    return null;
  }

  return doc;
}
