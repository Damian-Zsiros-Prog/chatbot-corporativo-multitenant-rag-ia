import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import type { ChatHistoryMessage } from "@/lib/rag/conversation-history";
import { streamAnswerQuestion } from "@/lib/rag/stream-answer";
import { toUserFacingError } from "@/lib/rag/errors";

export const maxDuration = 60;

const chatSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  conversationId: z.string().uuid().nullish(),
  editOfMessageId: z.string().uuid().optional(),
  regenerate: z.boolean().optional(),
});

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

async function resolveConversationId(
  db: ReturnType<typeof getDb>,
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>,
  message: string,
  conversationId?: string | null,
): Promise<string> {
  if (conversationId) {
    const [existing] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!existing || existing.userId !== session.userId) {
      throw new Response(JSON.stringify({ error: "Conversación no encontrada" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return conversationId;
  }

  const [created] = await db
    .insert(conversations)
    .values({
      tenantId: session.tenantId,
      userId: session.userId,
      title: message.slice(0, 80),
    })
    .returning();

  return created.id;
}

async function loadConversationHistory(
  db: ReturnType<typeof getDb>,
  conversationId: string,
): Promise<ChatHistoryMessage[]> {
  const rows = await db
    .select({
      role: messages.role,
      content: messages.content,
    })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));

  return rows
    .filter((row) => row.role === "user" || row.role === "assistant")
    .map((row) => ({
      role: row.role as "user" | "assistant",
      content: row.content,
    }));
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = chatSchema.parse(await request.json());
    const db = getDb();
    const conversationId = await resolveConversationId(
      db,
      session,
      body.message,
      body.conversationId,
    );

    const history = await loadConversationHistory(db, conversationId);
    const question = body.message;

    if (!body.regenerate) {
      await db.insert(messages).values({
        conversationId,
        role: "user",
        content: question,
        editOfMessageId: body.editOfMessageId ?? null,
      });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(sseEvent(event, data)));
        };

        try {
          send("meta", { conversationId });

          for await (const chunk of streamAnswerQuestion(question, session, {
            history,
            signal: request.signal,
          })) {
            if (chunk.kind === "token") {
              send("token", { content: chunk.content });
            } else if (chunk.kind === "result") {
              const result = chunk.result;

              await db.insert(messages).values({
                conversationId,
                role: "assistant",
                content: result.answer,
                citations: result.citations,
                responseType: result.type,
                model: result.model,
                bestScore: Math.round(result.bestScore * 10000),
                trace: result.trace,
                latencyMs: result.latencyMs,
              });

              await db
                .update(conversations)
                .set({ updatedAt: new Date() })
                .where(eq(conversations.id, conversationId));

              send("done", {
                conversationId,
                type: result.type,
                answer: result.answer,
                citations: result.citations,
                latencyMs: result.latencyMs,
              });
            }
          }
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            send("cancelled", { conversationId });
            return;
          }
          console.error("Chat stream error:", error);
          send("error", { error: toUserFacingError(error) });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Mensaje inválido" },
        { status: 400 },
      );
    }

    console.error("Chat error:", error);
    return NextResponse.json(
      { error: toUserFacingError(error) },
      { status: 500 },
    );
  }
}
