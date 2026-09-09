"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { SessionPayload } from "@/lib/auth/session";
import { welcomeMessage } from "@/lib/rag/messages";
import type { Citation, DocumentStatus } from "@/lib/db/schema";

type DocumentItem = {
  id: string;
  title: string;
  sectionRef: string | null;
  status: DocumentStatus;
  allowedRoles: string[];
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  latencyMs?: number;
  type?: "answer" | "conversational" | "no_information" | "out_of_scope";
};

type ChatShellProps = {
  session: SessionPayload;
  documents: DocumentItem[];
};

function statusLabel(status: DocumentItem["status"]) {
  switch (status) {
    case "vectorized":
      return { text: "Vectorizado", className: "badge-vectorized" };
    case "indexing":
      return { text: "Indexando", className: "badge-queued" };
    case "error":
      return {
        text: "Error",
        className:
          "bg-[var(--color-error-container)] text-[var(--color-error)]",
      };
    default:
      return { text: "En cola", className: "badge-queued" };
  }
}

function renderWithCitations(
  content: string,
  citations: Citation[] | undefined,
  onSelect: (citation: Citation, index: number) => void,
) {
  if (!citations?.length) return content;

  const parts = content.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[(\d+)\]$/);
    if (!match) {
      return <span key={i}>{part}</span>;
    }

    const index = Number(match[1]);
    const citation = citations[index - 1];
    if (!citation) return <span key={i}>{part}</span>;

    return (
      <button
        key={i}
        type="button"
        className="citation-chip mx-0.5 cursor-pointer hover:scale-105 transition-transform"
        onClick={() => onSelect(citation, index)}
      >
        [{index}]
      </button>
    );
  });
}

type StreamDonePayload = {
  conversationId: string;
  type: ChatMessage["type"];
  answer: string;
  citations: Citation[];
  latencyMs: number;
};

async function consumeChatStream(
  response: Response,
  handlers: {
    onMeta: (data: { conversationId: string }) => void;
    onToken: (content: string) => void;
    onDone: (data: StreamDonePayload) => void;
    onError: (message: string) => void;
  },
) {
  if (!response.body) {
    throw new Error("Respuesta vacía del servidor");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const block of events) {
      if (!block.trim()) continue;

      let eventName = "message";
      let dataLine = "";

      for (const line of block.split("\n")) {
        if (line.startsWith("event: ")) eventName = line.slice(7).trim();
        if (line.startsWith("data: ")) dataLine = line.slice(6);
      }

      if (!dataLine) continue;

      const payload = JSON.parse(dataLine) as Record<string, unknown>;

      if (eventName === "meta") {
        handlers.onMeta(payload as { conversationId: string });
      } else if (eventName === "token") {
        handlers.onToken(String((payload as { content: string }).content));
      } else if (eventName === "done") {
        handlers.onDone(payload as StreamDonePayload);
      } else if (eventName === "error") {
        handlers.onError(String((payload as { error: string }).error));
      }
    }
  }
}

export function ChatShell({ session, documents }: ChatShellProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: welcomeMessage(session.tenantName),
    },
  ]);
  const [selectedCitation, setSelectedCitation] = useState<{
    citation: Citation;
    index: number;
  } | null>(null);

  const vectorizedCount = useMemo(
    () => documents.filter((d) => d.status === "vectorized").length,
    [documents],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, streamingId]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setStreamingId(assistantId);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          ...(conversationId ? { conversationId } : {}),
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Error en la consulta");
      }

      await consumeChatStream(response, {
        onMeta: ({ conversationId: id }) => setConversationId(id),
        onToken: (content) => {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId
                ? { ...message, content: message.content + content }
                : message,
            ),
          );
        },
        onDone: (data) => {
          setConversationId(data.conversationId);
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId
                ? {
                    ...message,
                    content: data.answer,
                    citations: data.citations,
                    latencyMs: data.latencyMs,
                    type: data.type,
                  }
                : message,
            ),
          );

          if (data.type === "answer" && data.citations?.[0]) {
            setSelectedCitation({ citation: data.citations[0], index: 1 });
          } else {
            setSelectedCitation(null);
          }
        },
        onError: (message) => {
          throw new Error(message);
        },
      });
    } catch (error) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content:
                  error instanceof Error
                    ? error.message
                    : "Error desconocido al procesar la consulta.",
              }
            : message,
        ),
      );
    } finally {
      setLoading(false);
      setStreamingId(null);
    }
  }

  return (
    <div className="h-full max-h-full flex flex-col overflow-hidden bg-[var(--color-background)]">
      <header className="h-14 border-b border-[var(--color-outline-variant)] bg-[var(--color-inverse-surface)] text-[var(--color-inverse-on-surface)] flex items-center justify-between px-6 shrink-0">
        <div>
          <p className="text-label-sm opacity-80">Workspace RAG</p>
          <p className="text-sm font-semibold">{session.tenantName}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm">{session.name}</p>
            <p className="text-xs opacity-80">
              {session.role} · {vectorizedCount}/{documents.length} docs indexados
            </p>
          </div>
          {(session.role === "admin_empresa" ||
            session.role === "super_admin") && (
            <a
              href="/admin"
              className="text-xs underline opacity-80 hover:opacity-100 hidden sm:inline"
            >
              Admin
            </a>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-[var(--color-inverse-on-surface)] hover:bg-white/10"
          >
            Salir
          </Button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <aside
          className="hidden lg:flex flex-col min-h-0 overflow-hidden border-r border-[var(--color-outline-variant)] bg-white shrink-0"
          style={{ width: "var(--sidebar-width)" }}
        >
          <div className="p-4 border-b border-[var(--color-outline-variant)]">
            <p className="text-label-sm text-[var(--color-on-surface-variant)]">
              Documentación autorizada
            </p>
            <p className="text-headline-md mt-1">{documents.length} documentos</p>
          </div>
          <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-2">
            {documents.map((doc) => {
              const badge = statusLabel(doc.status);
              return (
                <div
                  key={doc.id}
                  className="rounded-md border border-[var(--color-outline-variant)] p-3 bg-[var(--color-surface-container-low)]"
                >
                  <p className="text-sm font-medium text-[var(--color-on-surface)]">
                    {doc.title}
                  </p>
                  {doc.sectionRef ? (
                    <p className="text-mono-code mt-1 text-[var(--color-on-surface-variant)]">
                      {doc.sectionRef}
                    </p>
                  ) : null}
                  <span
                    className={`inline-flex mt-2 px-2 py-0.5 rounded text-[11px] font-semibold ${badge.className}`}
                  >
                    {badge.text}
                  </span>
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 md:p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 text-body-md ${
                    message.role === "user"
                      ? "bg-[var(--color-secondary)] text-[var(--color-on-secondary)]"
                      : "card-surface text-[var(--color-on-surface)]"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {message.role === "assistant" ? (
                      message.content ? (
                        <>
                          {renderWithCitations(
                            message.content,
                            message.citations,
                            (citation, index) =>
                              setSelectedCitation({ citation, index }),
                          )}
                          {streamingId === message.id ? (
                            <span className="inline-block w-2 h-4 ml-0.5 bg-[var(--color-citation-text)] animate-pulse align-middle" />
                          ) : null}
                        </>
                      ) : (
                        <span className="text-[var(--color-on-surface-variant)]">
                          Recuperando contexto...
                        </span>
                      )
                    ) : (
                      message.content
                    )}
                  </p>
                  {message.role === "assistant" &&
                  message.latencyMs &&
                  streamingId !== message.id &&
                  message.type === "answer" ? (
                    <p className="text-mono-code mt-2 text-[var(--color-on-surface-variant)]">
                      {message.latencyMs} ms
                      {message.citations?.length
                        ? ` · ${message.citations.length} fuente(s)`
                        : ""}
                    </p>
                  ) : null}
                  {message.role === "assistant" &&
                  streamingId !== message.id &&
                  message.type === "no_information" ? (
                    <p className="text-mono-code mt-2 text-[var(--color-on-surface-variant)]">
                      Este dato no figura en los documentos disponibles
                    </p>
                  ) : null}
                  {message.role === "assistant" &&
                  streamingId !== message.id &&
                  message.type === "out_of_scope" ? (
                    <p className="text-mono-code mt-2 text-[var(--color-on-surface-variant)]">
                      Solo respondo consultas sobre la empresa
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-[var(--color-outline-variant)] bg-white p-4 shrink-0"
          >
            <div className="max-w-3xl mx-auto flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Consulta reglamentos, políticas o procedimientos..."
                className="flex-1 h-11 rounded-md border border-[var(--color-outline-variant)] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-citation-text)] focus:ring-offset-2"
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !input.trim()}>
                {loading ? "..." : "Enviar"}
              </Button>
            </div>
            {vectorizedCount === 0 ? (
              <p className="text-center text-xs text-[var(--color-error)] mt-2">
                Ejecuta <code className="text-mono-code">pnpm ingest</code> para indexar documentos.
              </p>
            ) : null}
          </form>
        </main>

        <aside
          className="hidden xl:flex flex-col min-h-0 overflow-hidden border-l border-[var(--color-outline-variant)] bg-white shrink-0"
          style={{ width: "var(--inspector-width)" }}
        >
          <div className="p-4 border-b border-[var(--color-outline-variant)]">
            <p className="text-label-sm text-[var(--color-on-surface-variant)]">
              Inspector de fuentes
            </p>
            <p className="text-headline-md mt-1">
              {selectedCitation
                ? `Referencia [${selectedCitation.index}]`
                : "Sin selección"}
            </p>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-3">
            {selectedCitation ? (
              <>
                <div>
                  <p className="text-label-sm text-[var(--color-on-surface-variant)]">
                    Documento
                  </p>
                  <p className="text-sm font-medium mt-1">
                    {selectedCitation.citation.documentTitle}
                  </p>
                </div>
                {selectedCitation.citation.sectionRef ? (
                  <div>
                    <p className="text-label-sm text-[var(--color-on-surface-variant)]">
                      Sección
                    </p>
                    <p className="text-mono-code mt-1">
                      {selectedCitation.citation.sectionRef}
                    </p>
                  </div>
                ) : null}
                {selectedCitation.citation.score != null ? (
                  <div>
                    <p className="text-label-sm text-[var(--color-on-surface-variant)]">
                      Similitud
                    </p>
                    <span className="citation-chip mt-1 inline-flex">
                      Cosine: {selectedCitation.citation.score}
                    </span>
                  </div>
                ) : null}
                <div>
                  <p className="text-label-sm text-[var(--color-on-surface-variant)]">
                    Fragmento
                  </p>
                  <p className="text-body-md mt-2 p-3 rounded-md bg-[#fef08a]/40 border border-[#fde047] whitespace-pre-wrap">
                    {selectedCitation.citation.excerpt}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-body-md text-[var(--color-on-surface-variant)]">
                Haz clic en una cita [1] en la respuesta para ver el fragmento
                documental aquí.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
