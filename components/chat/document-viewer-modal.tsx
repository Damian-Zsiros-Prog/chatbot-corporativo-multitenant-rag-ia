"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DocumentPreviewPane } from "@/components/documents/document-preview-pane";
import { resolveDocumentViewMode } from "@/lib/documents/resolve-view-mode";
import type { DocumentViewMode, SpreadsheetSheetPreview } from "@/lib/documents/preview-content";

type DocumentMeta = {
  id: string;
  title: string;
  sectionRef: string | null;
  status: string;
  mimeType: string;
  fileName: string;
  chunkCount: number;
};

type DocumentViewerModalProps = {
  documentId: string | null;
  onClose: () => void;
  onAskAbout: (prompt: string) => void;
};

function viewModeLabel(viewMode: DocumentViewMode): string {
  switch (viewMode) {
    case "markdown":
      return "Markdown";
    case "iframe":
      return "PDF";
    case "html":
      return "Word";
    case "spreadsheet":
      return "Excel";
    default:
      return "Texto";
  }
}

export function DocumentViewerModal({
  documentId,
  onClose,
  onAskAbout,
}: DocumentViewerModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<DocumentMeta | null>(null);
  const [content, setContent] = useState("");
  const [htmlContent, setHtmlContent] = useState<string | undefined>();
  const [sheets, setSheets] = useState<SpreadsheetSheetPreview[] | undefined>();
  const [viewMode, setViewMode] = useState<DocumentViewMode>("text");
  const [fileUrl, setFileUrl] = useState("");

  useEffect(() => {
    if (!documentId) return;

    setLoading(true);
    setError(null);
    fetch(`/api/documents/${documentId}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "No se pudo cargar el documento");
        }
        setMeta(data.document);
        setContent(data.content ?? "");
        setHtmlContent(data.htmlContent);
        setSheets(data.sheets);
        setViewMode(
          resolveDocumentViewMode(
            data.viewMode ?? "text",
            data.document?.fileName,
            data.document?.mimeType,
          ),
        );
        setFileUrl(data.fileUrl ?? "");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error al cargar");
      })
      .finally(() => setLoading(false));
  }, [documentId]);

  if (!documentId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
      <div className="card-surface w-full sm:max-w-4xl max-h-[95dvh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-xl rounded-t-2xl sm:rounded-lg">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-4 border-b border-[var(--color-outline-variant)]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-label-sm text-[var(--color-on-surface-variant)]">
                Documento autorizado
              </p>
              {!loading && !error ? (
                <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)]">
                  {viewModeLabel(viewMode)}
                </span>
              ) : null}
            </div>
            <h2 className="text-headline-md mt-1 break-words">
              {meta?.title ?? "Cargando..."}
            </h2>
            {meta?.sectionRef ? (
              <p className="text-mono-code text-sm mt-1 break-all">{meta.sectionRef}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {meta ? (
              <Button
                type="button"
                size="sm"
                className="min-h-[44px] flex-1 sm:flex-none"
                onClick={() =>
                  onAskAbout(
                    `Según el documento "${meta.title}", ¿puedes explicarme sus puntos principales?`,
                  )
                }
              >
                Preguntar al asistente
              </Button>
            ) : null}
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="min-h-[44px]">
              Cerrar
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden p-4">
          {loading ? (
            <p className="text-sm text-[var(--color-on-surface-variant)]">
              Cargando documento...
            </p>
          ) : error ? (
            <p className="text-sm text-[var(--color-error)]">{error}</p>
          ) : (
            <DocumentPreviewPane
              viewMode={viewMode}
              content={content}
              htmlContent={htmlContent}
              sheets={sheets}
              fileUrl={fileUrl}
              title={meta?.title}
              fileName={meta?.fileName}
            />
          )}
        </div>

        {meta ? (
          <div className="p-4 border-t border-[var(--color-outline-variant)] text-xs text-[var(--color-on-surface-variant)] flex flex-wrap gap-3">
            <span>{meta.fileName}</span>
            <span>Estado: {meta.status}</span>
            <span>{meta.chunkCount} fragmentos indexados</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
