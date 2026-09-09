"use client";

import { useMemo, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { IconCollapse, IconExpand, IconSearch } from "@/components/chat/chat-icons";
import {
  filterConversations,
  groupConversationsByDate,
  type ConversationListItem,
} from "@/lib/chat/group-conversations";
import type { DocumentStatus } from "@/lib/db/schema";

type DocumentItem = {
  id: string;
  title: string;
  sectionRef: string | null;
  status: DocumentStatus;
};

type ConversationSidebarProps = {
  embedded?: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  conversations: ConversationListItem[];
  loadingHistory: boolean;
  activeConversationId: string | null;
  documents: DocumentItem[];
  userName: string;
  tenantName: string;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
  onOpenDocument: (id: string) => void;
  statusLabel: (status: DocumentStatus) => { text: string; className: string };
};

export function ConversationSidebar({
  embedded = false,
  collapsed,
  onToggleCollapse,
  conversations,
  loadingHistory,
  activeConversationId,
  documents,
  userName,
  tenantName,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onOpenDocument,
  statusLabel,
}: ConversationSidebarProps) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const grouped = useMemo(
    () => groupConversationsByDate(filterConversations(conversations, search)),
    [conversations, search],
  );

  if (collapsed && !embedded) {
    return (
      <div className="hidden lg:flex flex-col items-center py-4 gap-4 border-r border-[var(--color-outline-variant)] bg-[var(--color-inverse-surface)] w-14 shrink-0">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-2 rounded-lg text-[var(--color-inverse-on-surface)] hover:bg-white/10"
          title="Expandir sidebar"
        >
          <IconExpand />
        </button>
        <button
          type="button"
          onClick={onNewConversation}
          className="p-2 rounded-lg text-[var(--color-inverse-on-surface)] hover:bg-white/10 text-lg"
          title="Nueva consulta"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <aside
      className={`${embedded ? "flex" : "hidden lg:flex"} flex-col min-h-0 overflow-hidden border-r border-[var(--color-outline-variant)] bg-[var(--color-inverse-surface)] text-[var(--color-inverse-on-surface)] shrink-0 h-full w-full`}
      style={embedded ? undefined : { width: "var(--sidebar-width)" }}
    >
      <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2">
        <Logo size="sm" variant="light" />
        {!embedded ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-white/10"
            title="Colapsar sidebar"
          >
            <IconCollapse />
          </button>
        ) : null}
      </div>

      <div className="p-4 border-b border-white/10">
        <button
          type="button"
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-white/20 bg-white/5 text-sm font-medium hover:bg-white/10 transition-colors"
        >
          + Nueva consulta
        </button>
      </div>

      <div
        className={`p-4 border-b border-white/10 space-y-2 ${
          embedded ? "flex-1 min-h-0 flex flex-col" : ""
        }`}
      >
        <p className="text-label-sm opacity-70 shrink-0">Historial</p>
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 h-4 w-4" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversaciones..."
            className="w-full h-9 rounded-lg bg-white/10 border border-white/10 pl-9 pr-3 text-sm placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
          />
        </div>
        <div className={`${embedded ? "flex-1 min-h-0" : "max-h-44"} overflow-y-auto space-y-3`}>
          {loadingHistory ? (
            <p className="text-xs opacity-60">Cargando...</p>
          ) : grouped.length === 0 ? (
            <p className="text-xs opacity-60">Sin conversaciones</p>
          ) : (
            grouped.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] uppercase tracking-wide opacity-50 mb-1">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-lg px-2 py-1.5 ${
                        activeConversationId === item.id
                          ? "bg-white/15"
                          : "hover:bg-white/10"
                      }`}
                    >
                      {editingId === item.id ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            onRenameConversation(item.id, editTitle);
                            setEditingId(null);
                          }}
                        >
                          <input
                            autoFocus
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full h-8 rounded bg-white/10 px-2 text-xs"
                            onBlur={() => setEditingId(null)}
                          />
                        </form>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => onSelectConversation(item.id)}
                            className="w-full text-left"
                          >
                            <p className="text-xs font-medium line-clamp-2">
                              {item.title}
                            </p>
                            <p className="text-[10px] opacity-50 mt-0.5">
                              {item.messageCount} mensajes
                            </p>
                          </button>
                          <div className="flex gap-2 mt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(item.id);
                                setEditTitle(item.title);
                              }}
                              className="text-[10px] opacity-60 hover:opacity-100"
                            >
                              Renombrar
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteConversation(item.id)}
                              className="text-[10px] text-red-300 hover:text-red-200"
                            >
                              Eliminar
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-4 border-b border-white/10">
        <p className="text-label-sm opacity-70">Documentación</p>
        <p className="text-sm font-semibold mt-1">{documents.length} documentos</p>
      </div>

      <nav
        className={`${
          embedded ? "max-h-40 shrink-0" : "flex-1 min-h-0"
        } overflow-y-auto p-3 space-y-2 border-b border-white/10`}
      >
        {documents.map((doc) => {
          const badge = statusLabel(doc.status);
          return (
            <button
              key={doc.id}
              type="button"
              onClick={() => onOpenDocument(doc.id)}
              className="w-full text-left rounded-lg border border-white/10 p-3 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <p className="text-sm font-medium line-clamp-2">{doc.title}</p>
              <div className="flex items-center justify-between mt-2 gap-2">
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${badge.className}`}
                >
                  {badge.text}
                </span>
                <span className="text-[10px] opacity-70">Ver →</span>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] flex items-center justify-center text-sm font-semibold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{userName}</p>
            <p className="text-[10px] opacity-60 truncate">{tenantName}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
