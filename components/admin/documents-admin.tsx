"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { SessionPayload } from "@/lib/auth/session";
import {
  CATEGORY_LABELS,
  DOCUMENT_CATEGORIES,
} from "@/lib/documents/categories";
import { DocumentViewerModal } from "@/components/chat/document-viewer-modal";
import { ACCEPT_UPLOAD } from "@/lib/documents/file-types";
import type { Document, DocumentCategory, DocumentStatus } from "@/lib/db/schema";

type TenantOption = {
  slug: string;
  name: string;
};

type AdminDocument = Document & {
  tenantName?: string;
  tenantSlug?: string;
};

type DocumentsAdminProps = {
  session: SessionPayload;
  showTenantColumn?: boolean;
};

const ROLE_OPTIONS = ["empleado", "supervisor", "rh", "admin_empresa"] as const;

function statusBadge(status: DocumentStatus) {
  switch (status) {
    case "vectorized":
      return "badge-vectorized";
    case "indexing":
      return "badge-queued";
    case "error":
      return "bg-[var(--color-error-container)] text-[var(--color-error)]";
    default:
      return "badge-queued";
  }
}

export function DocumentsAdmin({
  session,
  showTenantColumn = false,
}: DocumentsAdminProps) {
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [uploadTenantSlug, setUploadTenantSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("reglamento");
  const [sectionRef, setSectionRef] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [viewerDocumentId, setViewerDocumentId] = useState<string | null>(
    null,
  );
  const [roles, setRoles] = useState<string[]>([
    "empleado",
    "supervisor",
    "rh",
    "admin_empresa",
  ]);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/documents");
    const data = await response.json();
    if (response.ok) {
      setDocuments(data.documents);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    if (!showTenantColumn) return;
    fetch("/api/tenants")
      .then((res) => res.json())
      .then((data: { tenants: TenantOption[] }) => {
        setTenants(data.tenants ?? []);
        if (data.tenants?.[0]) {
          setUploadTenantSlug(data.tenants[0].slug);
        }
      })
      .catch(() => undefined);
  }, [showTenantColumn]);

  function toggleRole(role: string) {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((item) => item !== role) : [...prev, role],
    );
  }

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault();
    if (!file || roles.length === 0) return;

    setUploading(true);
    setMessage(null);

    const form = new FormData();
    form.append("file", file);
    form.append("title", title || file.name.replace(/\.md$/i, ""));
    form.append("category", category);
    form.append("sectionRef", sectionRef);
    form.append("description", description);
    form.append("allowedRoles", roles.join(","));
    if (showTenantColumn && uploadTenantSlug) {
      form.append("tenantSlug", uploadTenantSlug);
    }

    try {
      const response = await fetch("/api/admin/documents", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Error al cargar");
      }

      setMessage(
        `Documento indexado: ${data.document.title} (${data.chunkCount} fragmentos). El asistente ya puede usarlo en consultas.`,
      );
      setTitle("");
      setSectionRef("");
      setDescription("");
      setFile(null);
      await loadDocuments();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al cargar");
    } finally {
      setUploading(false);
    }
  }

  async function handleReindex(id: string) {
    setMessage(null);
    const response = await fetch(`/api/admin/documents/${id}/reindex`, {
      method: "POST",
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Error al reindexar");
      return;
    }
    setMessage(
      `Reindexado: ${data.document.title} (${data.chunkCount} fragmentos).`,
    );
    await loadDocuments();
  }

  async function handleDelete(id: string, docTitle: string) {
    if (!confirm(`¿Eliminar "${docTitle}" y sus vectores?`)) return;

    const response = await fetch(`/api/admin/documents/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const data = await response.json();
      setMessage(data.error ?? "Error al eliminar");
      return;
    }
    setMessage(`Documento eliminado: ${docTitle}`);
    await loadDocuments();
  }

  return (
    <div className="space-y-6">
        <div className="card-surface p-4 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold">
            Subir documento (MD, TXT, PDF, DOCX, XLSX, XLS)
          </h2>
          <form onSubmit={handleUpload} className="grid gap-4 md:grid-cols-2">
            {showTenantColumn && (
              <label className="space-y-1 md:col-span-2">
                <span className="text-label-sm">Empresa destino</span>
                <select
                  value={uploadTenantSlug}
                  onChange={(e) => setUploadTenantSlug(e.target.value)}
                  className="w-full h-10 rounded-md border border-[var(--color-outline-variant)] px-3 text-sm"
                  required
                >
                  {tenants.map((tenant) => (
                    <option key={tenant.slug} value={tenant.slug}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="space-y-1">
              <span className="text-label-sm">Título</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-10 rounded-md border border-[var(--color-outline-variant)] px-3 text-sm"
                placeholder="Reglamento de vacaciones"
              />
            </label>
            <label className="space-y-1">
              <span className="text-label-sm">Categoría</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full h-10 rounded-md border border-[var(--color-outline-variant)] px-3 text-sm"
              >
                {DOCUMENT_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {CATEGORY_LABELS[item]}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-label-sm">Código / referencia</span>
              <input
                value={sectionRef}
                onChange={(e) => setSectionRef(e.target.value)}
                className="w-full h-10 rounded-md border border-[var(--color-outline-variant)] px-3 text-sm"
                placeholder="LC-REG-2025"
              />
            </label>
            <label className="space-y-1">
              <span className="text-label-sm">Archivo</span>
              <input
                type="file"
                accept={ACCEPT_UPLOAD}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm"
                required
              />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-label-sm">Descripción (opcional)</span>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-10 rounded-md border border-[var(--color-outline-variant)] px-3 text-sm"
                placeholder="Política de teletrabajo actualizada 2025"
              />
            </label>
            <fieldset className="md:col-span-2 space-y-2">
              <legend className="text-label-sm">Roles con acceso</legend>
              <div className="flex flex-wrap gap-3">
                {ROLE_OPTIONS.map((role) => (
                  <label key={role} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={roles.includes(role)}
                      onChange={() => toggleRole(role)}
                    />
                    {role}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="md:col-span-2">
              <Button type="submit" disabled={uploading || !file}>
                {uploading ? "Indexando..." : "Subir e indexar"}
              </Button>
            </div>
          </form>
          {message ? (
            <p className="text-sm text-[var(--color-on-surface-variant)]">{message}</p>
          ) : null}
        </div>

        <div className="card-surface overflow-hidden">
          <div className="p-4 border-b border-[var(--color-outline-variant)]">
            <h2 className="text-sm font-semibold">
              Documentos indexados ({documents.length})
            </h2>
          </div>
          {loading ? (
            <p className="p-4 text-sm">Cargando...</p>
          ) : (
            <>
            <div className="md:hidden divide-y divide-[var(--color-outline-variant)]">
              {documents.map((doc) => (
                <div key={doc.id} className="admin-data-card space-y-3">
                  {showTenantColumn ? (
                    <p className="text-xs text-[var(--color-on-surface-variant)]">
                      {doc.tenantName ?? "—"}
                    </p>
                  ) : null}
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    {doc.sectionRef ? (
                      <p className="text-mono-code text-xs break-all">{doc.sectionRef}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-[var(--color-surface-container-low)] px-2 py-1">
                      {CATEGORY_LABELS[doc.category as DocumentCategory] ?? doc.category}
                    </span>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${statusBadge(doc.status)}`}
                    >
                      {doc.status}
                    </span>
                    <span className="text-[var(--color-on-surface-variant)]">
                      {doc.chunkCount} chunks
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-on-surface-variant)] break-words">
                    Roles: {(doc.allowedRoles as string[]).join(", ")}
                  </p>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setViewerDocumentId(doc.id)}
                      className="min-h-[44px] text-sm text-[var(--color-citation-text)]"
                    >
                      Ver
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReindex(doc.id)}
                      className="min-h-[44px] text-sm text-[var(--color-citation-text)]"
                    >
                      Reindexar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id, doc.title)}
                      className="min-h-[44px] text-sm text-[var(--color-error)]"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block admin-table-scroll">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="bg-[var(--color-surface-container-low)] text-left">
                  <tr>
                    {showTenantColumn && <th className="p-3">Empresa</th>}
                    <th className="p-3">Título</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Chunks</th>
                    <th className="p-3">Roles</th>
                    <th className="p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-t border-[var(--color-outline-variant)]"
                    >
                      {showTenantColumn && (
                        <td className="p-3 text-xs">
                          {doc.tenantName ?? "—"}
                        </td>
                      )}
                      <td className="p-3">
                        <p className="font-medium">{doc.title}</p>
                        {doc.sectionRef ? (
                          <p className="text-mono-code text-xs">{doc.sectionRef}</p>
                        ) : null}
                      </td>
                      <td className="p-3">
                        {CATEGORY_LABELS[doc.category as DocumentCategory] ??
                          doc.category}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${statusBadge(doc.status)}`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="p-3">{doc.chunkCount}</td>
                      <td className="p-3 text-xs">
                        {(doc.allowedRoles as string[]).join(", ")}
                      </td>
                      <td className="p-3 space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setViewerDocumentId(doc.id)}
                          className="text-[var(--color-citation-text)] hover:underline"
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReindex(doc.id)}
                          className="text-[var(--color-citation-text)] hover:underline"
                        >
                          Reindexar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(doc.id, doc.title)}
                          className="text-[var(--color-error)] hover:underline"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>

      <DocumentViewerModal
        documentId={viewerDocumentId}
        onClose={() => setViewerDocumentId(null)}
        onAskAbout={() => setViewerDocumentId(null)}
      />
    </div>
  );
}
