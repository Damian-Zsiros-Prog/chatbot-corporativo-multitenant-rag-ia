import { NextResponse } from "next/server";
import { getDocumentForUser } from "@/lib/documents/access-document";
import { viewModeForMime } from "@/lib/documents/file-types";
import { buildDocumentPreviewFromBuffer } from "@/lib/documents/preview-content";
import { readFileSync } from "node:fs";
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
  let preview = {
    viewMode: viewModeForMime(document.mimeType),
    content: "",
    htmlContent: undefined as string | undefined,
    sheets: undefined as
      | Array<{ name: string; html: string }>
      | undefined,
  };

  if (filePath) {
    try {
      const buffer = readFileSync(filePath);
      const built = await buildDocumentPreviewFromBuffer(buffer, document.fileName);
      preview = {
        viewMode: built.viewMode,
        content: built.content,
        htmlContent: built.htmlContent,
        sheets: built.sheets,
      };
    } catch {
      preview.content = "";
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
    content: preview.content,
    htmlContent: preview.htmlContent,
    sheets: preview.sheets,
    viewMode: preview.viewMode,
    fileUrl: `/api/documents/${document.id}/file`,
  });
}
