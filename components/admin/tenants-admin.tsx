"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { normalizeTenantSlug } from "@/lib/admin/slug";

type TenantRow = {
  id: string;
  slug: string;
  name: string;
  sector: string;
  description: string | null;
  usersCount: number;
  documentsTotal: number;
  documentsVectorized: number;
  chunksTotal: number;
};

export function TenantsAdmin() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sector, setSector] = useState("");
  const [description, setDescription] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editSector, setEditSector] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const loadTenants = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/tenants");
    const data = await response.json();
    if (response.ok) {
      setTenants(data.tenants ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  useEffect(() => {
    if (!slugTouched && name) {
      setSlug(normalizeTenantSlug(name));
    }
  }, [name, slugTouched]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, sector, description }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Error al crear empresa");
      }

      setMessage(`Empresa creada: ${data.tenant.name}`);
      setName("");
      setSlug("");
      setSector("");
      setDescription("");
      setSlugTouched(false);
      await loadTenants();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al crear");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(tenant: TenantRow) {
    setEditingTenant(tenant);
    setEditName(tenant.name);
    setEditSector(tenant.sector);
    setEditDescription(tenant.description ?? "");
    setMessage(null);
  }

  async function handleUpdate(event: React.FormEvent) {
    event.preventDefault();
    if (!editingTenant) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/admin/tenants/${editingTenant.slug}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editName,
            sector: editSector,
            description: editDescription || null,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Error al actualizar empresa");
      }

      setMessage(`Empresa actualizada: ${data.tenant.name}`);
      setEditingTenant(null);
      await loadTenants();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al actualizar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(tenant: TenantRow) {
    if (
      !window.confirm(
        `¿Eliminar la empresa "${tenant.name}" y todos sus datos? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/tenants/${tenant.slug}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Error al eliminar empresa");
      }

      setMessage(`Empresa eliminada: ${tenant.name}`);
      if (editingTenant?.id === tenant.id) setEditingTenant(null);
      await loadTenants();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al eliminar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card-surface p-6 space-y-4">
        <h2 className="text-sm font-semibold">Nueva empresa</h2>
        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-label-sm">Nombre</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 rounded-md border border-[var(--color-outline-variant)] px-3 text-sm"
              placeholder="Transportes del Caribe"
              required
            />
          </label>
          <label className="space-y-1">
            <span className="text-label-sm">Slug (URL)</span>
            <input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              className="w-full h-10 rounded-md border border-[var(--color-outline-variant)] px-3 text-sm font-mono"
              placeholder="transportes-caribe"
              required
            />
          </label>
          <label className="space-y-1">
            <span className="text-label-sm">Sector</span>
            <input
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full h-10 rounded-md border border-[var(--color-outline-variant)] px-3 text-sm"
              placeholder="Transporte / Logística"
              required
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-label-sm">Descripción (opcional)</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-10 rounded-md border border-[var(--color-outline-variant)] px-3 text-sm"
              placeholder="Empresa simulada en Cartagena"
            />
          </label>
          <div className="md:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Creando..." : "Crear empresa"}
            </Button>
          </div>
        </form>
        {message ? (
          <p className="text-sm text-[var(--color-on-surface-variant)]">{message}</p>
        ) : null}
      </div>

      {editingTenant ? (
        <div className="card-surface p-6 space-y-4">
          <h2 className="text-sm font-semibold">
            Editar empresa — {editingTenant.slug}
          </h2>
          <form onSubmit={handleUpdate} className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-label-sm">Nombre</span>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full h-10 rounded-md border border-[var(--color-outline-variant)] px-3 text-sm"
                required
              />
            </label>
            <label className="space-y-1">
              <span className="text-label-sm">Sector</span>
              <input
                value={editSector}
                onChange={(e) => setEditSector(e.target.value)}
                className="w-full h-10 rounded-md border border-[var(--color-outline-variant)] px-3 text-sm"
                required
              />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-label-sm">Descripción</span>
              <input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full h-10 rounded-md border border-[var(--color-outline-variant)] px-3 text-sm"
              />
            </label>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditingTenant(null)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="card-surface overflow-hidden">
        <div className="p-4 border-b border-[var(--color-outline-variant)]">
          <h2 className="text-sm font-semibold">
            Empresas ({loading ? "…" : tenants.length})
          </h2>
        </div>
        {loading ? (
          <p className="p-4 text-sm">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-surface-container-low)] text-left">
                <tr>
                  <th className="p-3">Empresa</th>
                  <th className="p-3">Slug</th>
                  <th className="p-3">Usuarios</th>
                  <th className="p-3">Docs</th>
                  <th className="p-3">Chunks</th>
                  <th className="p-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className="border-t border-[var(--color-outline-variant)]"
                  >
                    <td className="p-3">
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-xs text-[var(--color-on-surface-variant)]">
                        {tenant.sector}
                      </p>
                    </td>
                    <td className="p-3 font-mono text-xs">{tenant.slug}</td>
                    <td className="p-3">{tenant.usersCount}</td>
                    <td className="p-3">
                      {tenant.documentsVectorized}/{tenant.documentsTotal}
                    </td>
                    <td className="p-3">{tenant.chunksTotal}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(tenant)}
                          className="text-xs text-[var(--color-citation-text)] hover:underline min-h-[44px] px-2"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(tenant)}
                          className="text-xs text-red-600 hover:underline min-h-[44px] px-2"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
