"use client";

import { Button } from "@/components/ui/button";
import { IconAttach, IconStop } from "@/components/chat/chat-icons";
import { ASSISTANT_NAME, LEGAL_DISCLAIMER, QUICK_PROMPTS } from "@/lib/constants";

type ChatInputBarProps = {
  input: string;
  loading: boolean;
  showQuickPrompts: boolean;
  followUpSuggestions: string[];
  vectorizedCount: number;
  documentsTotal: number;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  onPickPrompt: (prompt: string) => void;
  onAttachHint: () => void;
};

export function ChatInputBar({
  input,
  loading,
  showQuickPrompts,
  followUpSuggestions,
  vectorizedCount,
  documentsTotal,
  onInputChange,
  onSubmit,
  onStop,
  onPickPrompt,
  onAttachHint,
}: ChatInputBarProps) {
  const prompts = followUpSuggestions.length
    ? followUpSuggestions
    : showQuickPrompts
      ? QUICK_PROMPTS
      : [];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!loading) onSubmit();
      }}
      className="relative z-10 border-t border-[var(--color-outline-variant)] bg-white/90 backdrop-blur-sm p-3 sm:p-4 md:p-6 shrink-0 safe-bottom"
    >
      <div className="max-w-3xl mx-auto space-y-3">
        {prompts.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-2">
            {prompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onPickPrompt(prompt)}
                disabled={loading}
                className="px-3 py-1.5 rounded-full text-xs border border-[var(--color-outline-variant)] bg-white hover:border-[var(--color-citation-text)] hover:text-[var(--color-citation-text)] transition-colors disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        ) : null}

        <div className="chat-input-shell p-3 md:p-4 space-y-3">
          <textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!loading) onSubmit();
              }
            }}
            rows={2}
            placeholder={`Pregúntale a ${ASSISTANT_NAME} sobre reglamentos, políticas o procedimientos...`}
            className="w-full resize-none bg-transparent text-sm focus:outline-none placeholder:text-[var(--color-on-surface-variant)]"
            disabled={loading}
          />
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onAttachHint}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[var(--color-outline-variant)] text-xs text-[var(--color-on-surface-variant)] hover:border-[var(--color-citation-text)]"
                title="Ver documentos indexados en el panel lateral"
              >
                <IconAttach />
                Documentos
              </button>
              <span className="hidden sm:inline-flex h-9 items-center px-3 rounded-lg bg-[var(--color-surface-container-low)] text-[10px] text-[var(--color-on-surface-variant)]">
                Solo docs indexados · {vectorizedCount}/{documentsTotal}
              </span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <p className="text-[10px] text-[var(--color-on-surface-variant)] hidden md:block">
                Enter enviar · Shift+Enter línea
              </p>
              {loading ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onStop}
                  className="min-h-[44px] rounded-xl px-5 gap-2"
                >
                  <IconStop className="h-3 w-3" />
                  Detener
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!input.trim()}
                  className="min-h-[44px] rounded-xl px-6"
                >
                  Enviar →
                </Button>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-[var(--color-on-surface-variant)] leading-relaxed">
          {LEGAL_DISCLAIMER}
        </p>
        {vectorizedCount === 0 ? (
          <p className="text-center text-xs text-[var(--color-error)]">
            Ejecuta <code className="text-mono-code">pnpm ingest</code> para indexar
            documentos.
          </p>
        ) : null}
      </div>
    </form>
  );
}
