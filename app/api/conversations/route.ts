import { NextResponse } from "next/server";
import { listUserConversations } from "@/lib/chat/conversations";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const conversations = await listUserConversations(session);
  return NextResponse.json({ conversations });
}
