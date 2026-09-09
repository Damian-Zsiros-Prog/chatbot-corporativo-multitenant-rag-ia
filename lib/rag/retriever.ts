import type { SessionPayload } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { chunks, documents } from "@/lib/db/schema";
import { embedText } from "@/lib/ollama/embeddings";
import { cosineSimilarity } from "@/lib/rag/cosine";
import { categoryBoost } from "@/lib/documents/categories";
import { canAccessChunk } from "@/lib/rag/guardrails";
import { eq } from "drizzle-orm";

export type RetrievedChunk = {
  id: string;
  content: string;
  sectionRef: string | null;
  documentId: string;
  documentTitle: string;
  documentCode: string | null;
  score: number;
  citationIndex: number;
};

const TOP_K = Number(process.env.RAG_TOP_K ?? 5);
const MIN_SCORE = Number(process.env.RAG_MIN_SCORE ?? 0.55);

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function keywordBoost(query: string, content: string): number {
  const terms = normalizeForMatch(query)
    .split(/\s+/)
    .filter((term) => term.length >= 4);
  if (terms.length === 0) return 0;

  const normalizedContent = normalizeForMatch(content);
  const hits = terms.filter((term) => normalizedContent.includes(term)).length;
  return Math.min(hits * 0.04, 0.16);
}

export async function retrieveChunks(
  query: string,
  session: SessionPayload,
): Promise<{ chunks: RetrievedChunk[]; bestScore: number }> {
  const db = getDb();
  const queryEmbedding = await embedText(query);

  const rows = await db
    .select({
      chunk: chunks,
      document: documents,
    })
    .from(chunks)
    .innerJoin(documents, eq(chunks.documentId, documents.id))
    .where(eq(chunks.tenantId, session.tenantId));

  const scored = rows
    .filter((row) =>
      canAccessChunk(session.role, row.chunk.allowedRoles as string[]),
    )
    .map((row) => {
      const embedding = row.chunk.embedding as number[] | null;
      const vectorScore = embedding
        ? cosineSimilarity(queryEmbedding, embedding)
        : 0;
      const score =
        vectorScore +
        keywordBoost(query, row.chunk.content) +
        categoryBoost(query, row.document.category ?? "otro");

      return {
        id: row.chunk.id,
        content: row.chunk.content,
        sectionRef: row.chunk.sectionRef,
        documentId: row.document.id,
        documentTitle: row.document.title,
        documentCode: row.document.sectionRef,
        score,
        citationIndex: 0,
      };
    })
    .filter((item) => item.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K)
    .map((item, index) => ({ ...item, citationIndex: index + 1 }));

  const bestScore = scored[0]?.score ?? 0;
  return { chunks: scored, bestScore };
}

export function buildContextBlock(items: RetrievedChunk[]): string {
  return items
    .map(
      (item) =>
        `[${item.citationIndex}] Documento: ${item.documentTitle}${item.documentCode ? ` (${item.documentCode})` : ""}${item.sectionRef ? ` — ${item.sectionRef}` : ""}\n${item.content}`,
    )
    .join("\n\n---\n\n");
}

export function getMinScoreThreshold(): number {
  return MIN_SCORE;
}
