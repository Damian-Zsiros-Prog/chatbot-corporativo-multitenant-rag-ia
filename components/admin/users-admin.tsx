"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ROLE_LABELS,
  TENANT_ASSIGNABLE_ROLES,
  type TenantAssignableRole,
} from "@/lib/admin/roles";
import type { SessionPayload } from "@/lib/auth/session";
import { DEMO_PASSWORD } from "@/lib/constants";

type TenantOption = {
  slug: string;
  name: string;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantName?: string;
  tenantSlug?: string;
};

type UsersAdminProps = {
  session: SessionPayload;
  showTenantColumn?: boolean;
  showTenantFilter?: boolean;
  fixedTenantSlug?: string;
  title?: string;
};

export function UsersAdmin({
  session,
  showTenantColumn = false,
  showTenantFilter = false,
  fixedTenantSlug,
  title,
}: UsersAdminProps) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [filterTenantSlug, setFilterTenantSlug] = useState("");
  const [createTenantSlug, setCreateTenantSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [role, setRole] = useState<TenantAssignableRole>("empleado");
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<TenantAssignableRole>("empleado");
  const [editPassword, setEditPassword] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    const tenantSlug = fixedTenantSlug ?? filterTenantSlug;
    if (tenantSlug) params.set("tenantSlug", tenantSlug);

    const response = await fetch(
      `/api/admin/users${params.size ? `?${params}` : ""}`,
    );
    const data = await response.json();
    if (response.ok) {
      setUsers(data.users ?? []);
    }
    setLoading(false);
  }, [filterTenantSlug, fixedTenantSlug]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!showTenantFilter && !showTenantColumn) return;
    fetch("/api/tenants")
      .then((res) => res.json())
      .then((data: { tenants: TenantOption[] }) => {
        const list = data.tenants ?? [];
        setTenants(list);
        if (list[0] && !createTenantSlug) {
          setCreateTenantSlug(list[0].slug);
        }
      })
      .catch(() => undefined);
  }, [showTenantFilter, showTenantColumn, createTenantSlug]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const tenantSlug =
      fixedTenantSlug ??
      (session.role === "super_admin" ? createTenantSlug : undefined);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          tenantSlug,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Error al crear usuario");
      }

      setMessage(`Usuario creado: ${data.user.email} (${data.user.role})`);
      setName("");
      setEmail("");
      setPassword(DEMO_PASSWORD);
      setRole("empleado");
      await loadUsers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al crear");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(user: UserRow) {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role as TenantAssignableRole);
    setEditPassword("");
    setMessage(null);
  }

  async function handleUpdate(event: React.FormEvent) {
    event.preventDefault();
    if (!editingUser) return;

    setSaving(true);
    setMessage(null);

    try {
      const body: Record<string, string> = {
        name: editName,
        role: editRole,
      };
      if (editPassword.trim()) {
        body.password = editPassword;
      }

      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Error al actualizar usuario");
      }

      setMessage(`Usuario actualizado: ${data.user.email}`);
      setEditingUser(null);
      await loadUsers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al actualizar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: UserRow) {
    if (
      !window.confirm(
        `¿Eliminar a ${user.name} (${user.email})? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Error al eliminar usuario");
      }

      setMessage(`Usuario eliminado: ${user.email}`);
      if (editingUser?.id === user.id) setEditingUser(null);
      await loadUsers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al eliminar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card-surface p-6 space-y-4">
        <h2 className="text-sm font-semibold">
          {title ?? "Nuevo usuario"}
        </h2>
        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
          {showTenantColumn && session.role === "super_admin" && (
            <label className="space-y-1 md:col-span-2">
              <span className="text-label-sm">Empresa</span>
              <select
                value={createTenantSlug}
                onChange={(e) => setCreateTenantSlug(e.target.value)}
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
            <span className="text-label-sm">Nombre</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 rounded-md border border-[var(--color-outline-variant)] px-3 text-sm"
              placeholder="María García"
              required
            />
          </label>
          <label className="space-y-1">
            <span className="text-label-sm">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 rounded-md border border-[var(--color-outline-variant)] px-3 text-sm"
              placeholder="empleado@empresa.demo"
              required
            />
          </label>
          <label className="space-y-1">
            <span className="text-label-sm">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 rounded-md border border-[var(--color-outline-variant)] px-3 text-sm"
              minLength={6}
              required
            />
          </label>
          <label className="space-y-1">
            <span className="text-label-sm">Rol</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as TenantAssignableRole)}
              className="w-full h-10 rounded-md border border-[var(--color-outline-variant)] px-3 text-sm"
            >
              {TENANT_ASSIGNABLE_ROLES.map((item) => (
                <option key={item} value={item}>
                  {ROLE_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
          <div className="md:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Creando..." : "Crear usuario"}
            </Button>
          </div>
        </form>
        {message ? (
          <p className="text-sm text-[var(--color-on-surface-variant)]">{message}</p>
        ) : null}
      </div>

      {editingUser ? (
        <div className="card-surface p-6 space-y-4">
          <h2 className="text-sm font-semibold">
            Editar usuario — {editingUser.email}
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
              <span className="text-label-sm">Rol</span>
              <select
                value={editRole}
                onChange={(e) =>
                  setEditRole(e.target.value as TenantAssignableRole)
                }
                className="w-full h-10 rounded-md border border-[var(--color-outline-variant)] px-3 text-sm"
              >
                {TENANT_ASSIGNABLE_ROLES.map((item) => (
                  <option key={item} value={item}>
                    {ROLE_LABELS[item]}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-label-sm">
                Nueva contraseña (opcional)
              </span>
              <input
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="w-full h-10 rounded-md border border-[var(--color-outline-variant)] px-3 text-sm"
                minLength={6}
                placeholder="Dejar vacío para no cambiar"
              />
            </label>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditingUser(null)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="card-surface overflow-hidden">
        <div className="p-4 border-b border-[var(--color-outline-variant)] flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">
            Usuarios ({loading ? "…" : users.length})
          </h2>
          {showTenantFilter && (
            <select
              value={filterTenantSlug}
              onChange={(e) => setFilterTenantSlug(e.target.value)}
              className="h-9 rounded-md border border-[var(--color-outline-variant)] px-3 text-sm"
            >
              <option value="">Todas las empresas</option>
              {tenants.map((tenant) => (
                <option key={tenant.slug} value={tenant.slug}>
                  {tenant.name}
                </option>
              ))}
            </select>
          )}
        </div>
        {loading ? (
          <p className="p-4 text-sm">Cargando...</p>
        ) : (
          <>
          <div className="md:hidden divide-y divide-[var(--color-outline-variant)]">
            {users.map((user) => (
              <div key={user.id} className="admin-data-card space-y-2">
                {showTenantColumn ? (
                  <p className="text-xs text-[var(--color-on-surface-variant)]">
                    {user.tenantName ?? "—"}
                  </p>
                ) : null}
                <p className="font-medium">{user.name}</p>
                <p className="font-mono text-xs break-all">{user.email}</p>
                <span className="inline-flex rounded-full bg-[var(--color-surface-container)] px-2 py-0.5 text-xs">
                  {ROLE_LABELS[user.role as TenantAssignableRole] ?? user.role}
                </span>
                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => openEdit(user)}
                    className="min-h-[44px] text-sm text-[var(--color-citation-text)]"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(user)}
                    className="min-h-[44px] text-sm text-red-600"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block admin-table-scroll">
            <table className="w-full text-sm min-w-[520px]">
              <thead className="bg-[var(--color-surface-container-low)] text-left">
                <tr>
                  {showTenantColumn && <th className="p-3">Empresa</th>}
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-[var(--color-outline-variant)]"
                  >
                    {showTenantColumn && (
                      <td className="p-3 text-xs">{user.tenantName ?? "—"}</td>
                    )}
                    <td className="p-3">{user.name}</td>
                    <td className="p-3 font-mono text-xs">{user.email}</td>
                    <td className="p-3">
                      <span className="inline-flex rounded-full bg-[var(--color-surface-container)] px-2 py-0.5 text-xs">
                        {ROLE_LABELS[user.role as TenantAssignableRole] ??
                          user.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(user)}
                          className="text-xs text-[var(--color-citation-text)] hover:underline min-h-[44px] px-2"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(user)}
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
          </>
        )}
      </div>
    </div>
  );
}
