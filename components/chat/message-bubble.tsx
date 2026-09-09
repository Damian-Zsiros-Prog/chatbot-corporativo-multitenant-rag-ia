"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ASSISTANT_NAME } from "@/lib/constants";
import { formatLatency } from "@/lib/chat/format-latency";
import type { Citation } from "@/lib/db/schema";
import { AssistantMessageContent } from "@/components/chat/assistant-message-content";
import { InlineSourceCards } from "@/components/chat/inline-source-cards";
import { MarkdownContent } from "@/components/ui/markdown-content";
import {
  IconCopy,
  IconEdit,
  IconRefresh,
  IconThumbDown,
  IconThumbUp,
} from "@/components/chat/chat-icons";

export type ChatMessageView = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  latencyMs?: number;
  type?: "answer" | "conversational" | "no_information" | "out_of_scope";
  editOfMessageId?: string | null;
  createdAt?: Date;
};

type MessageBubbleProps = {
  message: ChatMessageView;
  userName: string;
  isStreaming: boolean;
  feedback?: "up" | "down";
  onSelectCitation: (citation: Citation, index: number) => void;
  onViewAllCitations: () => void;
  onCopy: () => void;
  onRegenerate?: () => void;
  onEditUserMessage?: (messageId: string, newContent: string) => void;
  onFeedback: (value: "up" | "down") => void;
};

function AssistantAvatar() {
  return (
    <div className="assistant-orb h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-white text-sm font-bold">
      R
    </div>
  );
}

function UserAvatar({ name }: { name: string }) {
  return (
    <div className="h-9 w-9 shrink-0 rounded-full bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] flex items-center justify-center text-sm font-semibold">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function MessageBubble({
  message,
  userName,
  isStreaming,
  feedback,
  onSelectCitation,
  onViewAllCitations,
  onCopy,
  onRegenerate,
  onEditUserMessage,
  onFeedback,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);

  function saveEdit() {
    const trimmed = draft.trim();
    if (!trimmed || !onEditUserMessage) return;
    onEditUserMessage(message.id, trimmed);
    setEditing(false);
  }

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {isUser ? <UserAvatar name={userName} /> : <AssistantAvatar />}

      <div
        className={`max-w-[min(92%,640px)] sm:max-w-[min(85%,640px)] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1 min-w-0`}
      >
        <div className="flex items-center gap-2 text-[10px] text-[var(--color-on-surface-variant)]">
          <span className="font-medium">
            {isUser ? userName : ASSISTANT_NAME}
          </span>
          {message.editOfMessageId ? (
            <span className="rounded-full bg-[var(--color-warning-bg)] px-2 py-0.5 text-[9px] font-semibold text-[var(--color-warning-text)]">
              Versión editada
            </span>
          ) : null}
          {message.createdAt ? (
            <span>
              {message.createdAt.toLocaleTimeString("es-CO", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          ) : null}
        </div>

        {editing && isUser ? (
          <div className="w-full space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-[var(--color-outline-variant)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary-container)]"
            />
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
              <Button type="button" size="sm" onClick={saveEdit} disabled={!draft.trim()}>
                Enviar edición
              </Button>
            </div>
            <p className="text-[10px] text-[var(--color-on-surface-variant)]">
              Se conservará la versión anterior en el historial y el contexto.
            </p>
          </div>
        ) : (
          <div
            className={`rounded-2xl px-4 py-3 text-body-md ${
              isUser
                ? "bg-[var(--color-secondary)] text-[var(--color-on-secondary)] rounded-tr-md"
                : "card-surface text-[var(--color-on-surface)] rounded-tl-md"
            }`}
          >
            <div className="leading-relaxed">
              {!isUser ? (
                <AssistantMessageContent
                  content={message.content}
                  citations={message.citations}
                  isStreaming={isStreaming}
                  onSelectCitation={onSelectCitation}
                />
              ) : (
                <MarkdownContent content={message.content} variant="inverted" />
              )}
            </div>

            {!isUser && !isStreaming && message.type === "answer" && message.citations?.length ? (
              <InlineSourceCards
                citations={message.citations}
                onSelect={onSelectCitation}
                onViewAll={onViewAllCitations}
              />
            ) : null}

            {!isUser && !isStreaming && message.type === "no_information" ? (
              <p className="text-xs mt-2 text-[var(--color-on-surface-variant)]">
                Este dato no figura en los documentos disponibles
              </p>
            ) : null}

            {!isUser && !isStreaming && message.type === "out_of_scope" ? (
              <p className="text-xs mt-2 text-[var(--color-on-surface-variant)]">
                Solo respondo consultas sobre la empresa
              </p>
            ) : null}
          </div>
        )}

        {isUser && !editing && !isStreaming && onEditUserMessage ? (
          <div className="flex items-center gap-1 px-1">
            <button
              type="button"
              onClick={() => {
                setDraft(message.content);
                setEditing(true);
              }}
              className="min-h-[44px] min-w-[44px] p-2 rounded-lg hover:bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)]"
              title="Editar pregunta"
            >
              <IconEdit />
            </button>
          </div>
        ) : null}

        {!isUser && !isStreaming && message.content ? (
          <div className="flex flex-wrap items-center gap-1 px-1">
            {message.latencyMs && message.type === "answer" ? (
              <span className="text-[10px] text-[var(--color-on-surface-variant)] mr-2">
                Respondido en {formatLatency(message.latencyMs)}
              </span>
            ) : null}
            <button
              type="button"
              onClick={onCopy}
              className="min-h-[44px] min-w-[44px] p-2 rounded-lg hover:bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)]"
              title="Copiar"
            >
              <IconCopy />
            </button>
            {onRegenerate ? (
              <button
                type="button"
                onClick={onRegenerate}
                className="min-h-[44px] min-w-[44px] p-2 rounded-lg hover:bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)]"
                title="Regenerar"
              >
                <IconRefresh />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onFeedback("up")}
              className={`min-h-[44px] min-w-[44px] p-2 rounded-lg hover:bg-[var(--color-surface-container-low)] ${
                feedback === "up"
                  ? "text-[var(--color-success-text)] bg-[var(--color-success-bg)]"
                  : "text-[var(--color-on-surface-variant)]"
              }`}
              title="Útil"
            >
              <IconThumbUp />
            </button>
            <button
              type="button"
              onClick={() => onFeedback("down")}
              className={`min-h-[44px] min-w-[44px] p-2 rounded-lg hover:bg-[var(--color-surface-container-low)] ${
                feedback === "down"
                  ? "text-[var(--color-error)] bg-[var(--color-error-container)]"
                  : "text-[var(--color-on-surface-variant)]"
              }`}
              title="No útil"
            >
              <IconThumbDown />
            </button>
            {message.citations?.length ? (
              <button
                type="button"
                onClick={onViewAllCitations}
                className="text-[10px] text-[var(--color-citation-text)] hover:underline ml-1 px-2 py-1"
              >
                {message.citations.length} fuente(s)
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
