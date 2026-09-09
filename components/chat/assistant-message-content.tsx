"use client";

import type { Citation } from "@/lib/db/schema";
import { MarkdownContent } from "@/components/ui/markdown-content";

type AssistantMessageContentProps = {
  content: string;
  citations?: Citation[];
  isStreaming?: boolean;
  onSelectCitation: (citation: Citation, index: number) => void;
};

function CitationChip({
  index,
  citation,
  onSelect,
}: {
  index: number;
  citation: Citation;
  onSelect: (citation: Citation, index: number) => void;
}) {
  return (
    <button
      type="button"
      className="citation-chip mx-0.5 cursor-pointer hover:scale-105 transition-transform align-middle"
      onClick={() => onSelect(citation, index)}
    >
      [{index}]
    </button>
  );
}

export function AssistantMessageContent({
  content,
  citations,
  isStreaming,
  onSelectCitation,
}: AssistantMessageContentProps) {
  if (!content && isStreaming) {
    return (
      <span className="text-[var(--color-on-surface-variant)]">
        Consultando la base documental...
      </span>
    );
  }

  if (!content) return null;

  const hasCitations = Boolean(citations?.length);

  if (!hasCitations) {
    return (
      <>
        {isStreaming ? (
          <pre className="whitespace-pre-wrap leading-relaxed font-[inherit]">
            {content}
            <span className="inline-block w-2 h-4 ml-0.5 bg-[var(--color-citation-text)] animate-pulse align-middle" />
          </pre>
        ) : (
          <MarkdownContent content={content} />
        )}
      </>
    );
  }

  const parts = content.split(/(\[\d+\])/g);

  if (isStreaming) {
    return (
      <pre className="whitespace-pre-wrap leading-relaxed font-[inherit]">
        {parts.map((part, i) => {
          const match = part.match(/^\[(\d+)\]$/);
          if (!match) return <span key={i}>{part}</span>;

          const index = Number(match[1]);
          const citation = citations![index - 1];
          if (!citation) return <span key={i}>{part}</span>;

          return (
            <CitationChip
              key={i}
              index={index}
              citation={citation}
              onSelect={onSelectCitation}
            />
          );
        })}
        <span className="inline-block w-2 h-4 ml-0.5 bg-[var(--color-citation-text)] animate-pulse align-middle" />
      </pre>
    );
  }

  return (
    <div className="space-y-1">
      {parts.map((part, i) => {
        const match = part.match(/^\[(\d+)\]$/);
        if (match) {
          const index = Number(match[1]);
          const citation = citations![index - 1];
          if (!citation) return <span key={i}>{part}</span>;
          return (
            <CitationChip
              key={i}
              index={index}
              citation={citation}
              onSelect={onSelectCitation}
            />
          );
        }

        if (!part.trim()) return null;

        return <MarkdownContent key={i} content={part} />;
      })}
    </div>
  );
}
