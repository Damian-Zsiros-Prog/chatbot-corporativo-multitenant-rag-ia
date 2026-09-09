"use client";

import { Button } from "@/components/ui/button";
import type { Citation } from "@/lib/db/schema";

type CitationsModalProps = {
  citations: Citation[] | null;
  onClose: () => void;
  onSelect: (citation: Citation, index: number) => void;
};

export function CitationsModal({
  citations,
  onClose,
  onSelect,
}: CitationsModalProps) {
  if (!citations?.length) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
      <div
        className="card-surface w-full sm:max-w-2xl max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden shadow-xl rounded-t-2xl sm:rounded-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="citations-modal-title"
      >
        <div className="flex items-center justify-between border-b border-[var(--color-outline-variant)] p-4">
          <div>
            <p
              id="citations-modal-title"
              className="text-headline-md font-semibold"
            >
              Fuentes documentales
            </p>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
              {citations.length} referencia(s) utilizadas en la respuesta
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar">
            ✕
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
          {citations.map((citation, index) => (
            <button
              key={`${citation.chunkId}-${index}`}
              type="button"
              onClick={() => {
                onSelect(citation, index + 1);
                onClose();
              }}
              className="w-full text-left rounded-md border border-[var(--color-outline-variant)] p-4 hover:border-[var(--color-citation-text)] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="citation-chip shrink-0">[{index + 1}]</span>
                {citation.score != null ? (
                  <span className="text-xs text-[var(--color-on-surface-variant)]">
                    Similitud: {citation.score}
                  </span>
                ) : null}
              </div>
              <p className="text-sm font-medium mt-2">{citation.documentTitle}</p>
              {citation.sectionRef ? (
                <p className="text-mono-code text-xs text-[var(--color-on-surface-variant)] mt-1">
                  {citation.sectionRef}
                </p>
              ) : null}
              <p className="text-body-md mt-2 p-3 rounded-md bg-[#fef08a]/40 border border-[#fde047] whitespace-pre-wrap line-clamp-4">
                {citation.excerpt}
              </p>
              <p className="text-xs text-[var(--color-citation-text)] mt-2">
                Ver en inspector →
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
