"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CitationsModal } from "@/components/chat/citations-modal";
import { DocumentViewerModal } from "@/components/chat/document-viewer-modal";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import type { SessionPayload } from "@/lib/auth/session";
import { LEGAL_DISCLAIMER } from "@/lib/constants";
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

type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
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
        className="citation-chip mx-0.5 cursor-pointer hover:scale-105 transition-transform min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
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

function InspectorContent({
  selectedCitation,
}: {
  selectedCitation: { citation: Citation; index: number } | null;
}) {
  if (!selectedCitation) {
    return (
      <p className="text-body-md text-[var(--color-on-surface-variant)]">
        Haz clic en una cita [1] en la respuesta para ver el fragmento documental
        aquí.
      </p>
    );
  }

  const { citation, index } = selectedCitation;

  return (
    <>
      <div>
        <p className="text-label-sm text-[var(--color-on-surface-variant)]">
          Documento
        </p>
        <p className="text-sm font-medium mt-1">{citation.documentTitle}</p>
      </div>
      {citation.sectionRef ? (
        <div>
          <p className="text-label-sm text-[var(--color-on-surface-variant)]">
            Sección
          </p>
          <p className="text-mono-code mt-1">{citation.sectionRef}</p>
        </div>
      ) : null}
      {citation.score != null ? (
        <div>
          <p className="text-label-sm text-[var(--color-on-surface-variant)]">
            Similitud
          </p>
          <span className="citation-chip mt-1 inline-flex">
            Cosine: {citation.score}
          </span>
        </div>
      ) : null}
      <div>
        <p className="text-label-sm text-[var(--color-on-surface-variant)]">
          Fragmento [{index}]
        </p>
        <p className="text-body-md mt-2 p-3 rounded-md bg-[#fef08a]/40 border border-[#fde047] whitespace-pre-wrap">
          {citation.excerpt}
        </p>
      </div>
    </>
  );
}

export function ChatShell({ session, documents }: ChatShellProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
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
  const [viewerDocumentId, setViewerDocumentId] = useState<string | null>(null);
  const [citationsModal, setCitationsModal] = useState<Citation[] | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  const vectorizedCount = useMemo(
    () => documents.filter((d) => d.status === "vectorized").length,
    [documents],
  );

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/conversations");
      const data = await response.json();
      if (response.ok) {
        setConversations(data.conversations ?? []);
      }
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, streamingId]);

  function handleSelectCitation(citation: Citation, index: number) {
    setSelectedCitation({ citation, index });
    setInspectorOpen(true);
  }

  function startNewConversation() {
    setConversationId(null);
    setSelectedCitation(null);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: welcomeMessage(session.tenantName),
      },
    ]);
    setSidebarOpen(false);
  }

  async function loadConversation(id: string) {
    const response = await fetch(`/api/conversations/${id}`);
    const data = await response.json();
    if (!response.ok) return;

    setConversationId(id);
    setSidebarOpen(false);

    const loaded: ChatMessage[] = data.messages.map(
      (message: {
        id: string;
        role: "user" | "assistant";
        content: string;
        citations?: Citation[];
        responseType?: ChatMessage["type"];
        latencyMs?: number;
      }) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        citations: message.citations,
        type: message.responseType,
        latencyMs: message.latencyMs,
      }),
    );

    setMessages(
      loaded.length > 0
        ? loaded
        : [
            {
              id: "welcome",
              role: "assistant",
              content: welcomeMessage(session.tenantName),
            },
          ],
    );

    const lastAssistant = [...loaded]
      .reverse()
      .find((m) => m.role === "assistant" && m.citations?.length);
    if (lastAssistant?.citations?.[0]) {
      setSelectedCitation({
        citation: lastAssistant.citations[0],
        index: 1,
      });
    } else {
      setSelectedCitation(null);
    }
  }

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

          void loadConversations();
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

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-[var(--color-outline-variant)] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-label-sm text-[var(--color-on-surface-variant)]">
            Historial
          </p>
          <button
            type="button"
            onClick={startNewConversation}
            className="text-xs text-[var(--color-citation-text)] hover:underline min-h-[44px] px-2"
          >
            + Nueva
          </button>
        </div>
        <div className="max-h-36 overflow-y-auto space-y-1">
          {loadingHistory ? (
            <p className="text-xs text-[var(--color-on-surface-variant)]">
              Cargando...
            </p>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-[var(--color-on-surface-variant)]">
              Sin conversaciones previas
            </p>
          ) : (
            conversations.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => loadConversation(item.id)}
                className={`w-full text-left rounded-md px-2 py-2 text-xs transition-colors min-h-[44px] ${
                  conversationId === item.id
                    ? "bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]"
                    : "hover:bg-[var(--color-surface-container-low)]"
                }`}
              >
                <p className="font-medium line-clamp-2">{item.title}</p>
                <p className="text-[10px] opacity-70 mt-0.5">
                  {item.messageCount} mensajes
                </p>
              </button>
            ))
          )}
        </div>
      </div>

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
            <button
              key={doc.id}
              type="button"
              onClick={() => {
                setViewerDocumentId(doc.id);
                setSidebarOpen(false);
              }}
              className="w-full text-left rounded-md border border-[var(--color-outline-variant)] p-3 bg-[var(--color-surface-container-low)] hover:border-[var(--color-citation-text)] transition-colors min-h-[44px]"
            >
              <p className="text-sm font-medium text-[var(--color-on-surface)]">
                {doc.title}
              </p>
              {doc.sectionRef ? (
                <p className="text-mono-code mt-1 text-[var(--color-on-surface-variant)]">
                  {doc.sectionRef}
                </p>
              ) : null}
              <div className="flex items-center justify-between mt-2 gap-2">
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${badge.className}`}
                >
                  {badge.text}
                </span>
                <span className="text-[10px] text-[var(--color-citation-text)]">
                  Ver documento
                </span>
              </div>
            </button>
          );
        })}
      </nav>
    </>
  );

  const inspectorContent = (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-3">
      <InspectorContent selectedCitation={selectedCitation} />
    </div>
  );

  return (
    <div className="h-full max-h-full flex flex-col overflow-hidden bg-[var(--color-background)]">
      <header className="h-14 border-b border-[var(--color-outline-variant)] bg-[var(--color-inverse-surface)] text-[var(--color-inverse-on-surface)] flex items-center justify-between px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="lg:hidden min-h-[44px] min-w-[44px] rounded-md hover:bg-white/10 text-sm"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir documentos e historial"
          >
            ☰
          </button>
          <div>
            <p className="text-label-sm opacity-80">Workspace RAG</p>
            <p className="text-sm font-semibold">{session.tenantName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <button
            type="button"
            className="xl:hidden min-h-[44px] min-w-[44px] rounded-md hover:bg-white/10 text-sm"
            onClick={() => setInspectorOpen(true)}
            aria-label="Abrir inspector de fuentes"
          >
            📎
          </button>
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
              className="text-xs underline opacity-80 hover:opacity-100 hidden sm:inline min-h-[44px] inline-flex items-center"
            >
              Admin
            </a>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-[var(--color-inverse-on-surface)] hover:bg-white/10 min-h-[44px]"
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
          {sidebarContent}
        </aside>

        <MobileDrawer
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          title="Historial y documentos"
          side="left"
        >
          {sidebarContent}
        </MobileDrawer>

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
                            handleSelectCitation,
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
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="text-mono-code text-[var(--color-on-surface-variant)]">
                        {message.latencyMs} ms
                      </p>
                      {message.citations?.length ? (
                        <button
                          type="button"
                          onClick={() =>
                            setCitationsModal(message.citations ?? [])
                          }
                          className="text-mono-code text-[var(--color-citation-text)] hover:underline min-h-[44px] px-2 -ml-2"
                        >
                          · {message.citations.length} fuente(s) — ver todas
                        </button>
                      ) : null}
                    </div>
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
                className="flex-1 h-11 min-h-[44px] rounded-md border border-[var(--color-outline-variant)] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-citation-text)] focus:ring-offset-2"
                disabled={loading}
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="min-h-[44px]"
              >
                {loading ? "..." : "Enviar"}
              </Button>
            </div>
            <p className="max-w-3xl mx-auto text-center text-[11px] text-[var(--color-on-surface-variant)] mt-2 leading-relaxed">
              {LEGAL_DISCLAIMER}
            </p>
            {vectorizedCount === 0 ? (
              <p className="text-center text-xs text-[var(--color-error)] mt-2">
                Ejecuta <code className="text-mono-code">pnpm ingest</code> para
                indexar documentos.
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
          {inspectorContent}
        </aside>

        <MobileDrawer
          open={inspectorOpen}
          onClose={() => setInspectorOpen(false)}
          title={
            selectedCitation
              ? `Fuente [${selectedCitation.index}]`
              : "Inspector de fuentes"
          }
          side="right"
        >
          {inspectorContent}
        </MobileDrawer>
      </div>

      <CitationsModal
        citations={citationsModal}
        onClose={() => setCitationsModal(null)}
        onSelect={handleSelectCitation}
      />

      <DocumentViewerModal
        documentId={viewerDocumentId}
        onClose={() => setViewerDocumentId(null)}
        onAskAbout={(prompt) => {
          setViewerDocumentId(null);
          setInput(prompt);
        }}
      />
    </div>
  );
}
