import { avg, count, eq } from "drizzle-orm";
import type { AdminSession } from "@/lib/admin/require-admin";
import { getDb } from "@/lib/db";
import { chunks, documents, messages, users } from "@/lib/db/schema";

export async function getDashboardStats(session: AdminSession) {
  const db = getDb();
  const tenantFilter =
    session.role === "super_admin"
      ? undefined
      : eq(documents.tenantId, session.tenantId);

  const docsQuery = tenantFilter
    ? db.select().from(documents).where(tenantFilter)
    : db.select().from(documents);

  const allDocs = await docsQuery;
  const vectorized = allDocs.filter((doc) => doc.status === "vectorized").length;
  const queued = allDocs.filter((doc) => doc.status === "queued").length;
  const errors = allDocs.filter((doc) => doc.status === "error").length;

  const chunkRows = tenantFilter
    ? await db
        .select({ count: count() })
        .from(chunks)
        .where(eq(chunks.tenantId, session.tenantId))
    : await db.select({ count: count() }).from(chunks);

  const userRows = tenantFilter
    ? await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.tenantId, session.tenantId))
    : await db.select({ count: count() }).from(users);

  const assistantMessages = await db
    .select({
      total: count(),
      avgLatency: avg(messages.latencyMs),
    })
    .from(messages)
    .where(eq(messages.role, "assistant"));

  return {
    documentsTotal: allDocs.length,
    documentsVectorized: vectorized,
    documentsQueued: queued,
    documentsError: errors,
    chunksTotal: Number(chunkRows[0]?.count ?? 0),
    usersTotal: Number(userRows[0]?.count ?? 0),
    queriesTotal: Number(assistantMessages[0]?.total ?? 0),
    avgLatencyMs: Math.round(Number(assistantMessages[0]?.avgLatency ?? 0)),
    ollamaUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    model: process.env.OLLAMA_MODEL ?? "llama3.2",
  };
}
