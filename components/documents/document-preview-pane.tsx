"use client";

import { useMemo, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { MarkdownContent } from "@/components/ui/markdown-content";
import type {
  DocumentViewMode,
  SpreadsheetSheetPreview,
} from "@/lib/documents/preview-content";

type DocumentPreviewPaneProps = {
  viewMode: DocumentViewMode;
  content: string;
  htmlContent?: string;
  sheets?: SpreadsheetSheetPreview[];
  fileUrl?: string;
  title?: string;
  fileName?: string;
};

function SpreadsheetPreview({ sheets }: { sheets: SpreadsheetSheetPreview[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSheet = sheets[activeIndex];

  const sanitizedHtml = useMemo(
    () => DOMPurify.sanitize(activeSheet?.html ?? ""),
    [activeSheet?.html],
  );

  if (!sheets.length) {
    return (
      <p className="text-sm text-[var(--color-on-surface-variant)]">
        No hay hojas para mostrar.
      </p>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 gap-3">
      {sheets.length > 1 ? (
        <div className="flex flex-wrap gap-2 shrink-0">
          {sheets.map((sheet, index) => (
            <button
              key={sheet.name}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`min-h-[36px] px-3 rounded-lg text-xs font-medium border transition-colors ${
                index === activeIndex
                  ? "bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] border-transparent"
                  : "border-[var(--color-outline-variant)] hover:border-[var(--color-citation-text)]"
              }`}
            >
              {sheet.name}
            </button>
          ))}
        </div>
      ) : null}
      <div
        className="spreadsheet-preview flex-1 min-h-0 overflow-auto rounded-md border border-[var(--color-outline-variant)] bg-white"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </div>
  );
}

function DocxPreview({ htmlContent }: { htmlContent: string }) {
  const sanitized = useMemo(() => DOMPurify.sanitize(htmlContent), [htmlContent]);

  return (
    <div
      className="docx-preview h-full min-h-0 overflow-y-auto rounded-md border border-[var(--color-outline-variant)] bg-white p-4 sm:p-6"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

function PdfPreview({
  fileUrl,
  title,
  fileName,
}: {
  fileUrl: string;
  title?: string;
  fileName?: string;
}) {
  return (
    <div className="flex flex-col h-full min-h-0 gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
        <p className="text-xs text-[var(--color-on-surface-variant)]">
          Visor PDF integrado
        </p>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-[var(--color-citation-text)] hover:underline"
        >
          Abrir en nueva pestaña
        </a>
      </div>
      <iframe
        title={title ?? fileName ?? "Documento PDF"}
        src={`${fileUrl}#view=FitH&toolbar=1`}
        className="w-full flex-1 min-h-[50dvh] sm:min-h-[60vh] rounded-md border border-[var(--color-outline-variant)] bg-white"
      />
    </div>
  );
}

export function DocumentPreviewPane({
  viewMode,
  content,
  htmlContent,
  sheets,
  fileUrl,
  title,
  fileName,
}: DocumentPreviewPaneProps) {
  switch (viewMode) {
    case "iframe":
      if (!fileUrl) {
        return (
          <p className="text-sm text-[var(--color-on-surface-variant)]">
            No se pudo cargar el archivo PDF.
          </p>
        );
      }
      return <PdfPreview fileUrl={fileUrl} title={title} fileName={fileName} />;

    case "markdown":
      return (
        <div className="h-[50dvh] sm:h-[60vh] overflow-y-auto rounded-md border border-[var(--color-outline-variant)] bg-white p-4 sm:p-6">
          <MarkdownContent content={content} />
        </div>
      );

    case "html":
      return (
        <div className="h-[50dvh] sm:h-[60vh] min-h-0">
          {htmlContent ? (
            <DocxPreview htmlContent={htmlContent} />
          ) : (
            <div className="h-full overflow-y-auto rounded-md border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-4">
              <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {content || "Sin contenido extraíble."}
              </pre>
            </div>
          )}
        </div>
      );

    case "spreadsheet":
      return (
        <div className="h-[50dvh] sm:h-[60vh] min-h-0">
          {sheets?.length ? (
            <SpreadsheetPreview sheets={sheets} />
          ) : (
            <div className="h-full overflow-y-auto rounded-md border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-4">
              <MarkdownContent content={content} />
            </div>
          )}
        </div>
      );

    case "text":
    default:
      return (
        <div className="h-[50dvh] sm:h-[60vh] overflow-y-auto rounded-md border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-4">
          <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
            {content || "Sin contenido de texto extraíble."}
          </pre>
        </div>
      );
  }
}
