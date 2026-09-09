import { and, desc, eq } from "drizzle-orm";
import type { SessionPayload } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { conversations, messages, type Citation, type ResponseType } from "@/lib/db/schema";

export type ConversationSummary = {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
};

export type StoredMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  responseType?: ResponseType;
  latencyMs?: number;
  editOfMessageId?: string | null;
  createdAt: Date;
};

export async function listUserConversations(
  session: SessionPayload,
  limit = 30,
): Promise<ConversationSummary[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.userId, session.userId),
        eq(conversations.tenantId, session.tenantId),
      ),
    )
    .orderBy(desc(conversations.updatedAt))
    .limit(limit);

  const summaries: ConversationSummary[] = [];

  for (const row of rows) {
    const messageRows = await db
      .select({ id: messages.id })
      .from(messages)
      .where(eq(messages.conversationId, row.id));

    summaries.push({
      id: row.id,
      title: row.title,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      messageCount: messageRows.length,
    });
  }

  return summaries;
}

export async function getConversationMessages(
  session: SessionPayload,
  conversationId: string,
): Promise<{ conversation: ConversationSummary; messages: StoredMessage[] } | null> {
  const db = getDb();
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (
    !conversation ||
    conversation.userId !== session.userId ||
    conversation.tenantId !== session.tenantId
  ) {
    return null;
  }

  const messageRows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);

  return {
    conversation: {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messageCount: messageRows.length,
    },
    messages: messageRows.map((row) => ({
      id: row.id,
      role: row.role as "user" | "assistant",
      content: row.content,
      citations: row.citations ?? undefined,
      responseType: row.responseType ?? undefined,
      latencyMs: row.latencyMs ?? undefined,
      editOfMessageId: row.editOfMessageId ?? undefined,
      createdAt: row.createdAt,
    })),
  };
}

export async function deleteUserConversation(
  session: SessionPayload,
  conversationId: string,
): Promise<boolean> {
  const db = getDb();
  const [conversation] = await db
    .select({ id: conversations.id, userId: conversations.userId })
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conversation || conversation.userId !== session.userId) {
    return false;
  }

  await db.delete(conversations).where(eq(conversations.id, conversationId));
  return true;
}

export async function renameUserConversation(
  session: SessionPayload,
  conversationId: string,
  title: string,
): Promise<boolean> {
  const trimmed = title.trim();
  if (trimmed.length < 1 || trimmed.length > 120) {
    throw new Error("Título inválido");
  }

  const db = getDb();
  const [conversation] = await db
    .select({ id: conversations.id, userId: conversations.userId })
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conversation || conversation.userId !== session.userId) {
    return false;
  }

  await db
    .update(conversations)
    .set({ title: trimmed, updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  return true;
}
