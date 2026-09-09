import { readFileSync } from "node:fs";
import { NextResponse } from "next/server";
import { getDocumentForUser } from "@/lib/documents/access-document";
import { getSession } from "@/lib/auth/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await getDocumentForUser(session, id);
  if (!result?.filePath) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const buffer = readFileSync(result.filePath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": result.document.mimeType,
      "Content-Disposition": `inline; filename="${result.document.fileName}"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
