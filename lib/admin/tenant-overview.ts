import { avg, count, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { chunks, documents, messages, tenants, users } from "@/lib/db/schema";

export type TenantOverview = {
  id: string;
  slug: string;
  name: string;
  sector: string;
  description: string | null;
  usersCount: number;
  documentsTotal: number;
  documentsVectorized: number;
  chunksTotal: number;
};

export async function getTenantsOverview(): Promise<TenantOverview[]> {
  const db = getDb();
  const allTenants = await db.select().from(tenants);

  const overviews: TenantOverview[] = [];

  for (const tenant of allTenants) {
    const [userCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.tenantId, tenant.id));

    const tenantDocs = await db
      .select({ status: documents.status })
      .from(documents)
      .where(eq(documents.tenantId, tenant.id));

    const [chunkCount] = await db
      .select({ count: count() })
      .from(chunks)
      .where(eq(chunks.tenantId, tenant.id));

    overviews.push({
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      sector: tenant.sector,
      description: tenant.description,
      usersCount: Number(userCount?.count ?? 0),
      documentsTotal: tenantDocs.length,
      documentsVectorized: tenantDocs.filter((doc) => doc.status === "vectorized")
        .length,
      chunksTotal: Number(chunkCount?.count ?? 0),
    });
  }

  return overviews;
}

export type PlatformStats = {
  tenantsCount: number;
  usersTotal: number;
  documentsTotal: number;
  documentsVectorized: number;
  chunksTotal: number;
  queriesTotal: number;
  avgLatencyMs: number;
  ollamaUrl: string;
  model: string;
  embedModel: string;
  ragMinScore: string;
  ragTopK: string;
};

export async function getPlatformStats(): Promise<PlatformStats> {
  const db = getDb();
  const tenantsList = await getTenantsOverview();

  const [assistantStats] = await db
    .select({
      total: count(),
      avgLatency: avg(messages.latencyMs),
    })
    .from(messages)
    .where(eq(messages.role, "assistant"));

  return {
    tenantsCount: tenantsList.length,
    usersTotal: tenantsList.reduce((sum, tenant) => sum + tenant.usersCount, 0),
    documentsTotal: tenantsList.reduce(
      (sum, tenant) => sum + tenant.documentsTotal,
      0,
    ),
    documentsVectorized: tenantsList.reduce(
      (sum, tenant) => sum + tenant.documentsVectorized,
      0,
    ),
    chunksTotal: tenantsList.reduce(
      (sum, tenant) => sum + tenant.chunksTotal,
      0,
    ),
    queriesTotal: Number(assistantStats?.total ?? 0),
    avgLatencyMs: Math.round(Number(assistantStats?.avgLatency ?? 0)),
    ollamaUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    model: process.env.OLLAMA_MODEL ?? "llama3.2",
    embedModel: process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text",
    ragMinScore: process.env.RAG_MIN_SCORE ?? "0.65",
    ragTopK: process.env.RAG_TOP_K ?? "5",
  };
}
