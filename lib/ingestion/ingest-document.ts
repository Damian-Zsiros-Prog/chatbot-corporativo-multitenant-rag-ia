import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { chunks, documents, tenants, type Document } from "@/lib/db/schema";
import { chunkMarkdown, estimateTokens } from "@/lib/ingestion/chunker";
import { embedTexts } from "@/lib/ollama/embeddings";

function resolveDocumentFilePath(
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

export async function ingestDocument(documentId: string): Promise<number> {
  const db = getDb();

  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  if (!doc) {
    throw new Error(`Documento no encontrado: ${documentId}`);
  }

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, doc.tenantId))
    .limit(1);

  if (!tenant) {
    throw new Error(`Tenant no encontrado para documento ${documentId}`);
  }

  const filePath = resolveDocumentFilePath(doc, tenant.slug);
  if (!filePath) {
    await db
      .update(documents)
      .set({
        status: "error",
        errorMessage: "Archivo no encontrado en disco",
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId));
    throw new Error(`Archivo no encontrado para ${doc.title}`);
  }

  await db
    .update(documents)
    .set({ status: "indexing", errorMessage: null, updatedAt: new Date() })
    .where(eq(documents.id, documentId));

  try {
    const raw = readFileSync(filePath, "utf-8");
    const textChunks = chunkMarkdown(raw);

    await db.delete(chunks).where(eq(chunks.documentId, documentId));

    const embeddings = await embedTexts(textChunks.map((c) => c.content));

    for (let i = 0; i < textChunks.length; i++) {
      const piece = textChunks[i];
      await db.insert(chunks).values({
        tenantId: doc.tenantId,
        documentId: doc.id,
        content: piece.content,
        sectionRef: piece.sectionRef ?? doc.sectionRef,
        chunkIndex: piece.chunkIndex,
        tokenCount: estimateTokens(piece.content),
        embedding: embeddings[i],
        allowedRoles: doc.allowedRoles,
      });
    }

    await db
      .update(documents)
      .set({
        status: "vectorized",
        chunkCount: textChunks.length,
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId));

    return textChunks.length;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error desconocido al indexar";

    await db
      .update(documents)
      .set({
        status: "error",
        errorMessage: message,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId));

    throw error;
  }
}

export async function ingestAllDocuments(options?: {
  force?: boolean;
}): Promise<void> {
  const db = getDb();

  let toProcess = await db
    .select({ id: documents.id, title: documents.title, status: documents.status })
    .from(documents);

  if (!options?.force) {
    const pending = toProcess.filter((doc) => doc.status === "queued");
    toProcess =
      pending.length > 0
        ? pending
        : toProcess.filter((doc) => doc.status === "error");
  }

  if (toProcess.length === 0) {
    console.log("  No hay documentos pendientes de indexar.");
    return;
  }

  for (const doc of toProcess) {
    console.log(`  Indexando: ${doc.title} (${doc.status})...`);
    const count = await ingestDocument(doc.id);
    console.log(`    ✓ ${count} chunks vectorizados`);
  }
}
