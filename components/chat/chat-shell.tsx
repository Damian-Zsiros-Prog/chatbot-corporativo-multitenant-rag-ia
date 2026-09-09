"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CitationsModal } from "@/components/chat/citations-modal";
import { ChatInputBar } from "@/components/chat/chat-input-bar";
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";
import { DocumentViewerModal } from "@/components/chat/document-viewer-modal";
import { MessageBubble, type ChatMessageView } from "@/components/chat/message-bubble";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import {
  IconHelp,
  IconMenu,
  IconSources,
  IconStop,
} from "@/components/chat/chat-icons";
import type { SessionPayload } from "@/lib/auth/session";
import { consumeChatStream } from "@/lib/chat/consume-stream";
import { getFollowUpSuggestions } from "@/lib/chat/follow-up-suggestions";
import { ASSISTANT_NAME } from "@/lib/constants";
import { welcomeMessage } from "@/lib/rag/messages";
import type { Citation, DocumentStatus } from "@/lib/db/schema";

type DocumentItem = {
  id: string;
  title: string;
  sectionRef: string | null;
  status: DocumentStatus;
  allowedRoles: string[];
};

type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
};

type ChatMessage = ChatMessageView;

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

function InspectorContent({
  selectedCitation,
}: {
  selectedCitation: { citation: Citation; index: number } | null;
}) {
  if (!selectedCitation) {
    return (
      <p className="text-body-md text-[var(--color-on-surface-variant)]">
        Haz clic en una cita o tarjeta de fuente para ver el fragmento documental.
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
            Relevancia
          </p>
          <span className="citation-chip mt-1 inline-flex">
            {Math.round(citation.score * 100)}%
          </span>
        </div>
      ) : null}
      <div>
        <p className="text-label-sm text-[var(--color-on-surface-variant)]">
          Fragmento [{index}]
        </p>
        <p className="text-body-md mt-2 p-3 rounded-md bg-[var(--color-warning-bg)] border border-[var(--color-warning-text)]/20 whitespace-pre-wrap">
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
  const [activeTitle, setActiveTitle] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [ollamaOk, setOllamaOk] = useState<boolean | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([]);
  const [messageFeedback, setMessageFeedback] = useState<
    Record<string, "up" | "down">
  >({});
  const abortRef = useRef<AbortController | null>(null);
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
    fetch("/api/ollama/health")
      .then((res) => res.json())
      .then((data: { ok?: boolean }) => setOllamaOk(Boolean(data.ok)))
      .catch(() => setOllamaOk(false));
  }, [loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, streamingId]);

  function handleSelectCitation(citation: Citation, index: number) {
    setSelectedCitation({ citation, index });
    setInspectorOpen(true);
  }

  function startNewConversation() {
    abortRef.current?.abort();
    setConversationId(null);
    setActiveTitle(null);
    setSelectedCitation(null);
    setFollowUpSuggestions([]);
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
    setActiveTitle(data.conversation?.title ?? null);
    setFollowUpSuggestions([]);
    setSidebarOpen(false);

    const loaded: ChatMessage[] = data.messages.map(
      (message: {
        id: string;
        role: "user" | "assistant";
        content: string;
        citations?: Citation[];
        responseType?: ChatMessage["type"];
        latencyMs?: number;
        editOfMessageId?: string | null;
        createdAt: string;
      }) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        citations: message.citations,
        type: message.responseType,
        latencyMs: message.latencyMs,
        editOfMessageId: message.editOfMessageId,
        createdAt: new Date(message.createdAt),
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

  async function deleteConversation(id: string) {
    if (!window.confirm("¿Eliminar esta conversación?")) return;
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (conversationId === id) startNewConversation();
    await loadConversations();
  }

  async function renameConversation(id: string, title: string) {
    const response = await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (response.ok) {
      if (conversationId === id) setActiveTitle(title);
      await loadConversations();
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function stopGeneration() {
    abortRef.current?.abort();
    setLoading(false);
    setStreamingId(null);
  }

  async function sendMessage(
    textOverride?: string,
    options?: { editOfMessageId?: string; regenerate?: boolean },
  ) {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;

    const isRegenerate = options?.regenerate ?? false;

    setInput("");
    setLoading(true);
    setFollowUpSuggestions([]);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      editOfMessageId: options?.editOfMessageId ?? null,
      createdAt: new Date(),
    };
    const assistantId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      ...(isRegenerate ? [] : [userMessage]),
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setStreamingId(assistantId);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: text,
          ...(conversationId ? { conversationId } : {}),
          ...(options?.editOfMessageId
            ? { editOfMessageId: options.editOfMessageId }
            : {}),
          ...(isRegenerate ? { regenerate: true } : {}),
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Error en la consulta");
      }

      await consumeChatStream(
        response,
        {
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
                      createdAt: new Date(),
                    }
                  : message,
              ),
            );

            if (data.type === "answer" && data.citations?.[0]) {
              setSelectedCitation({ citation: data.citations[0], index: 1 });
            } else {
              setSelectedCitation(null);
            }

            setFollowUpSuggestions(
              getFollowUpSuggestions(text, data.citations),
            );
            void loadConversations();
          },
          onError: (message) => {
            throw new Error(message);
          },
        },
        controller.signal,
      );
    } catch (error) {
      const isAbort = error instanceof DOMException && error.name === "AbortError";
      setMessages((prev) =>
        prev.map((message) => {
          if (message.id !== assistantId) return message;
          if (isAbort) {
            return {
              ...message,
              content: message.content.trim()
                ? `${message.content.trim()}\n\n— Generación detenida —`
                : "Generación detenida.",
              type: "conversational",
            };
          }
          return {
            ...message,
            content:
              error instanceof Error
                ? error.message
                : "Error desconocido al procesar la consulta.",
          };
        }),
      );
    } finally {
      setLoading(false);
      setStreamingId(null);
      abortRef.current = null;
    }
  }

  async function editUserMessage(messageId: string, newContent: string) {
    await sendMessage(newContent, { editOfMessageId: messageId });
  }

  async function regenerateFromMessage(assistantMessageId: string) {
    const idx = messages.findIndex((m) => m.id === assistantMessageId);
    if (idx <= 0) return;

    let userIdx = idx - 1;
    while (userIdx >= 0 && messages[userIdx].role !== "user") userIdx -= 1;
    if (userIdx < 0) return;

    const userText = messages[userIdx].content;
    await sendMessage(userText, { regenerate: true });
  }

  async function copyMessage(content: string) {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      /* clipboard unavailable */
    }
  }

  const showHero =
    messages.length === 1 &&
    messages[0]?.id === "welcome" &&
    !loading &&
    !streamingId;

  const visibleMessages = messages.filter(
    (m) => !(showHero && m.id === "welcome"),
  );

  const mobileSidebar = (
    <ConversationSidebar
      embedded
      collapsed={false}
      onToggleCollapse={() => undefined}
      conversations={conversations}
      loadingHistory={loadingHistory}
      activeConversationId={conversationId}
      documents={documents}
      userName={session.name}
      tenantName={session.tenantName}
      onNewConversation={startNewConversation}
      onSelectConversation={loadConversation}
      onDeleteConversation={deleteConversation}
      onRenameConversation={renameConversation}
      onOpenDocument={(id) => {
        setViewerDocumentId(id);
        setSidebarOpen(false);
      }}
      statusLabel={statusLabel}
    />
  );

  const inspectorContent = (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-3">
      <InspectorContent selectedCitation={selectedCitation} />
    </div>
  );

  return (
    <div className="h-full max-h-full flex flex-col overflow-hidden bg-[var(--color-background)]">
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <ConversationSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          conversations={conversations}
          loadingHistory={loadingHistory}
          activeConversationId={conversationId}
          documents={documents}
          userName={session.name}
          tenantName={session.tenantName}
          onNewConversation={startNewConversation}
          onSelectConversation={loadConversation}
          onDeleteConversation={deleteConversation}
          onRenameConversation={renameConversation}
          onOpenDocument={setViewerDocumentId}
          statusLabel={statusLabel}
        />

        <MobileDrawer
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          title="Historial y documentos"
          side="left"
        >
          {mobileSidebar}
        </MobileDrawer>

        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden relative">
          <div className="hero-glow absolute inset-0 pointer-events-none opacity-60" />

          <header className="relative z-10 h-14 border-b border-[var(--color-outline-variant)] bg-white/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                className="lg:hidden min-h-[44px] min-w-[44px] rounded-lg hover:bg-[var(--color-surface-container-low)] flex items-center justify-center"
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menú"
              >
                <IconMenu />
              </button>
              <nav className="hidden sm:flex items-center gap-1 text-sm shrink-0">
                {(session.role === "admin_empresa" ||
                  session.role === "super_admin") && (
                  <a
                    href="/admin"
                    className="px-3 py-1.5 rounded-lg text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)]"
                  >
                    Dashboard
                  </a>
                )}
                <span className="px-3 py-1.5 rounded-lg bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] font-medium">
                  Asistente IA
                </span>
              </nav>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {activeTitle ?? session.tenantName}
                </p>
                <p className="text-[10px] text-[var(--color-on-surface-variant)] truncate hidden sm:block">
                  {session.name} · {session.role}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`hidden sm:inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full max-w-[8rem] truncate ${
                  ollamaOk
                    ? "bg-[var(--color-success-bg)] text-[var(--color-success-text)]"
                    : ollamaOk === false
                      ? "bg-[var(--color-error-container)] text-[var(--color-error)]"
                      : "bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)]"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    ollamaOk ? "bg-[var(--color-success-text)]" : "bg-[var(--color-error)]"
                  }`}
                />
                {ollamaOk ? "Motor IA online" : ollamaOk === false ? "Motor IA offline" : "..."}
              </span>
              <button
                type="button"
                className="xl:hidden min-h-[44px] min-w-[44px] rounded-lg hover:bg-[var(--color-surface-container-low)] flex items-center justify-center"
                onClick={() => setInspectorOpen(true)}
                aria-label="Abrir fuentes"
              >
                <IconSources />
              </button>
              <button
                type="button"
                onClick={() => setShowHelp((v) => !v)}
                className="min-h-[44px] min-w-[44px] rounded-lg hover:bg-[var(--color-surface-container-low)] flex items-center justify-center text-[var(--color-on-surface-variant)]"
                title="Ayuda"
              >
                <IconHelp />
              </button>
              {loading ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={stopGeneration}
                  className="min-h-[44px] gap-2"
                >
                  <IconStop className="h-3 w-3" />
                  Detener
                </Button>
              ) : null}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="min-h-[44px]">
                Salir
              </Button>
            </div>
          </header>

          {showHelp ? (
            <div className="relative z-10 mx-4 md:mx-6 mt-3 rounded-xl border border-[var(--color-outline-variant)] bg-white p-4 text-sm text-[var(--color-on-surface-variant)]">
              <p className="font-medium text-[var(--color-on-surface)] mb-2">
                Atajos y consejos
              </p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Enter envía · Shift+Enter nueva línea</li>
                <li>Clic en [1] o tarjetas de fuente abre el inspector</li>
                <li>Usa Regenerar si la respuesta no fue útil</li>
                <li>El historial se agrupa por Hoy, Ayer y Esta semana</li>
              </ul>
            </div>
          ) : null}

          <div className="relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 md:p-6 space-y-6">
            {loading ? (
              <div className="sticky top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-2 bg-[var(--color-warning-bg)] border-b border-[var(--color-warning-text)]/20 flex items-center justify-between gap-3">
                <p className="text-xs text-[var(--color-warning-text)]">
                  {ASSISTANT_NAME} está respondiendo…
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={stopGeneration}
                  className="min-h-[36px] gap-2 shrink-0"
                >
                  <IconStop className="h-3 w-3" />
                  Detener
                </Button>
              </div>
            ) : null}
            {showHero ? (
              <div className="flex flex-col items-center justify-center py-8 md:py-16 text-center max-w-2xl mx-auto">
                <div className="assistant-orb h-20 w-20 md:h-24 md:w-24 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-6 animate-pulse">
                  R
                </div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Hola, soy{" "}
                  <span className="text-[var(--color-citation-text)]">
                    {ASSISTANT_NAME}
                  </span>
                </h2>
                <p className="text-[var(--color-on-surface-variant)] mt-3 leading-relaxed">
                  Asistente documental de {session.tenantName}. Consulta
                  horarios, vacaciones, políticas SST, código de conducta y más.
                </p>
              </div>
            ) : null}

            {visibleMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                userName={session.name}
                isStreaming={streamingId === message.id}
                feedback={messageFeedback[message.id]}
                onSelectCitation={handleSelectCitation}
                onViewAllCitations={() =>
                  setCitationsModal(message.citations ?? [])
                }
                onCopy={() => copyMessage(message.content)}
                onRegenerate={
                  message.role === "assistant" && message.id !== "welcome"
                    ? () => regenerateFromMessage(message.id)
                    : undefined
                }
                onFeedback={(value) =>
                  setMessageFeedback((prev) => ({
                    ...prev,
                    [message.id]: value,
                  }))
                }
                onEditUserMessage={
                  message.role === "user" && message.id !== "welcome"
                    ? editUserMessage
                    : undefined
                }
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <ChatInputBar
            input={input}
            loading={loading}
            showQuickPrompts={showHero}
            followUpSuggestions={followUpSuggestions}
            vectorizedCount={vectorizedCount}
            documentsTotal={documents.length}
            onInputChange={setInput}
            onSubmit={() => void sendMessage()}
            onStop={stopGeneration}
            onPickPrompt={(prompt) => {
              setInput(prompt);
              void sendMessage(prompt);
            }}
            onAttachHint={() => setSidebarOpen(true)}
          />
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
          hideAbove="xl"
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
