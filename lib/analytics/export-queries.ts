import { and, desc, eq, lt } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  conversations,
  messages,
  tenants,
  users,
} from "@/lib/db/schema";

export type QueryLogRow = {
  messageId: string;
  conversationId: string;
  tenantSlug: string;
  tenantName: string;
  userEmail: string;
  userRole: string;
  question: string;
  answer: string;
  responseType: string | null;
  model: string | null;
  bestScore: number | null;
  latencyMs: number | null;
  citationsCount: number;
  trace: unknown;
  createdAt: string;
};

export async function fetchQueryLogs(limit = 500): Promise<QueryLogRow[]> {
  const db = getDb();

  const assistantRows = await db
    .select({
      assistant: messages,
      conversation: conversations,
      tenant: tenants,
      user: users,
    })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .innerJoin(tenants, eq(conversations.tenantId, tenants.id))
    .innerJoin(users, eq(conversations.userId, users.id))
    .where(eq(messages.role, "assistant"))
    .orderBy(desc(messages.createdAt))
    .limit(limit);

  const logs: QueryLogRow[] = [];

  for (const row of assistantRows) {
    const [questionRow] = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, row.conversation.id),
          eq(messages.role, "user"),
          lt(messages.createdAt, row.assistant.createdAt),
        ),
      )
      .orderBy(desc(messages.createdAt))
      .limit(1);

    const userQuestion = questionRow?.content ?? "";

    logs.push({
      messageId: row.assistant.id,
      conversationId: row.conversation.id,
      tenantSlug: row.tenant.slug,
      tenantName: row.tenant.name,
      userEmail: row.user.email,
      userRole: row.user.role,
      question: userQuestion,
      answer: row.assistant.content,
      responseType: row.assistant.responseType ?? null,
      model: row.assistant.model ?? null,
      bestScore: row.assistant.bestScore ?? null,
      latencyMs: row.assistant.latencyMs ?? null,
      citationsCount: row.assistant.citations?.length ?? 0,
      trace: row.assistant.trace ?? null,
      createdAt: new Date(row.assistant.createdAt).toISOString(),
    });
  }

  return logs;
}

export function toCsv(rows: QueryLogRow[]): string {
  const headers = [
    "createdAt",
    "tenantSlug",
    "userEmail",
    "userRole",
    "question",
    "responseType",
    "bestScore",
    "latencyMs",
    "citationsCount",
    "model",
    "answer",
  ];

  const escape = (value: string | number | null) => {
    const text = value == null ? "" : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.createdAt,
        row.tenantSlug,
        row.userEmail,
        row.userRole,
        row.question,
        row.responseType,
        row.bestScore,
        row.latencyMs,
        row.citationsCount,
        row.model,
        row.answer,
      ]
        .map(escape)
        .join(","),
    ),
  ];

  return lines.join("\n");
}
