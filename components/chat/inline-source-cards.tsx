"use client";

import type { Citation } from "@/lib/db/schema";

type InlineSourceCardsProps = {
  citations: Citation[];
  onSelect: (citation: Citation, index: number) => void;
  onViewAll: () => void;
};

export function InlineSourceCards({
  citations,
  onSelect,
  onViewAll,
}: InlineSourceCardsProps) {
  if (!citations.length) return null;

  const preview = citations.slice(0, 2);

  return (
    <div className="mt-3 space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">
        Fuentes consultadas
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {preview.map((citation, index) => (
          <button
            key={`${citation.chunkId}-${index}`}
            type="button"
            onClick={() => onSelect(citation, index + 1)}
            className="text-left rounded-lg border border-[var(--color-citation-border)] bg-[var(--color-citation-bg)] p-3 hover:border-[var(--color-citation-text)] transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="citation-chip">[{index + 1}]</span>
              {citation.score != null ? (
                <span className="text-[10px] text-[var(--color-on-surface-variant)]">
                  {Math.round(citation.score * 100)}% relevancia
                </span>
              ) : null}
            </div>
            <p className="text-xs font-medium mt-2 line-clamp-1">
              {citation.documentTitle}
            </p>
            {citation.sectionRef ? (
              <p className="text-[10px] text-[var(--color-on-surface-variant)] mt-1 line-clamp-1">
                {citation.sectionRef}
              </p>
            ) : null}
          </button>
        ))}
      </div>
      {citations.length > 2 ? (
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs text-[var(--color-citation-text)] hover:underline"
        >
          Ver las {citations.length} fuentes →
        </button>
      ) : null}
    </div>
  );
}
