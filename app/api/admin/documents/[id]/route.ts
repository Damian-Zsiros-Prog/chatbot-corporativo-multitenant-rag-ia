import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { removeDocument } from "@/lib/documents/manage-document";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    await removeDocument(session, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al eliminar" },
      { status: 404 },
    );
  }
}
