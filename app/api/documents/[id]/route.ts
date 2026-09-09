import { NextResponse } from "next/server";
import { getDocumentForUser } from "@/lib/documents/access-document";
import { extractTextFromFile } from "@/lib/documents/extract-text";
import { viewModeForMime } from "@/lib/documents/file-types";
import { getSession } from "@/lib/auth/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await getDocumentForUser(session, id);
  if (!result) {
    return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
  }

  const { document, filePath } = result;
  let content = "";

  if (filePath) {
    try {
      content = await extractTextFromFile(filePath);
    } catch {
      content = "";
    }
  }

  return NextResponse.json({
    document: {
      id: document.id,
      title: document.title,
      sectionRef: document.sectionRef,
      category: document.category,
      status: document.status,
      mimeType: document.mimeType,
      fileName: document.fileName,
      chunkCount: document.chunkCount,
    },
    content,
    viewMode: viewModeForMime(document.mimeType),
    fileUrl: `/api/documents/${document.id}/file`,
  });
}
