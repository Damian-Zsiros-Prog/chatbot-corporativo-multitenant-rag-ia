import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { reindexDocument } from "@/lib/documents/manage-document";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const result = await reindexDocument(session, id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al reindexar" },
      { status: 500 },
    );
  }
}
