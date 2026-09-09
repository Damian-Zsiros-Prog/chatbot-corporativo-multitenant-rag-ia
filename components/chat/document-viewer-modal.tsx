"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

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

export function DocumentViewerModal({
  documentId,
  onClose,
  onAskAbout,
}: DocumentViewerModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<DocumentMeta | null>(null);
  const [content, setContent] = useState("");
  const [viewMode, setViewMode] = useState<"iframe" | "text" | "html">("text");
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
        setViewMode(data.viewMode ?? "text");
        setFileUrl(data.fileUrl ?? "");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error al cargar");
      })
      .finally(() => setLoading(false));
  }, [documentId]);

  if (!documentId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="card-surface w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
        <div className="flex items-start justify-between gap-4 p-4 border-b border-[var(--color-outline-variant)]">
          <div>
            <p className="text-label-sm text-[var(--color-on-surface-variant)]">
              Documento autorizado
            </p>
            <h2 className="text-headline-md mt-1">
              {meta?.title ?? "Cargando..."}
            </h2>
            {meta?.sectionRef ? (
              <p className="text-mono-code text-sm mt-1">{meta.sectionRef}</p>
            ) : null}
          </div>
          <div className="flex gap-2 shrink-0">
            {meta ? (
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  onAskAbout(
                    `Según el documento "${meta.title}", ¿puedes explicarme sus puntos principales?`,
                  )
                }
              >
                Preguntar al asistente
              </Button>
            ) : null}
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
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
          ) : viewMode === "iframe" && fileUrl ? (
            <iframe
              title={meta?.title ?? "Documento"}
              src={fileUrl}
              className="w-full h-[60vh] rounded-md border border-[var(--color-outline-variant)] bg-white"
            />
          ) : (
            <div className="h-[60vh] overflow-y-auto rounded-md border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-4">
              <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {content || "Sin contenido de texto extraíble."}
              </pre>
            </div>
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
