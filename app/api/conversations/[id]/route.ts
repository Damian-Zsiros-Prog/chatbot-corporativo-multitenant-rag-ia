import { NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteUserConversation,
  getConversationMessages,
  renameUserConversation,
} from "@/lib/chat/conversations";
import { getSession } from "@/lib/auth/session";

const patchSchema = z.object({
  title: z.string().trim().min(1).max(120),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await context.params;
  const data = await getConversationMessages(session, id);

  if (!data) {
    return NextResponse.json(
      { error: "Conversación no encontrada" },
      { status: 404 },
    );
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const body = patchSchema.parse(await request.json());
    const updated = await renameUserConversation(session, id, body.title);
    if (!updated) {
      return NextResponse.json(
        { error: "Conversación no encontrada" },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, title: body.title });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Título inválido" }, { status: 400 });
    }
    const message =
      error instanceof Error ? error.message : "Error al renombrar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await deleteUserConversation(session, id);

  if (!deleted) {
    return NextResponse.json(
      { error: "Conversación no encontrada" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
