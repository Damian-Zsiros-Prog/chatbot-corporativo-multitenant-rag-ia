import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/lib/admin/dashboard-stats";
import { requireAdmin } from "@/lib/admin/require-admin";

export default async function AdminHomePage() {
  const session = await requireAdmin();
  if (!session) redirect("/login");

  if (session.role === "super_admin") {
    redirect("/admin/super");
  }

  const stats = await getDashboardStats(session);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <p className="text-label-sm text-[var(--color-citation-text)]">Dashboard</p>
        <h1 className="text-2xl font-bold mt-1">{session.tenantName}</h1>
        <p className="text-sm text-[var(--color-on-surface-variant)] mt-2 max-w-2xl">
          Resumen operativo de tu base documental. Cada documento indexado
          alimenta a Regula con nuevos fragmentos vectorizados.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="stat-card">
          <p className="text-xs text-[var(--color-on-surface-variant)]">
            Documentos vectorizados
          </p>
          <p className="text-3xl font-bold mt-2 text-[var(--color-secondary)]">
            {stats.documentsVectorized}
            <span className="text-lg text-[var(--color-on-surface-variant)] font-normal">
              /{stats.documentsTotal}
            </span>
          </p>
          {stats.documentsError > 0 && (
            <p className="text-xs text-[var(--color-error)] mt-1">
              {stats.documentsError} con error
            </p>
          )}
        </div>
        <div className="stat-card">
          <p className="text-xs text-[var(--color-on-surface-variant)]">
            Chunks indexados
          </p>
          <p className="text-3xl font-bold mt-2">{stats.chunksTotal}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-[var(--color-on-surface-variant)]">
            Consultas registradas
          </p>
          <p className="text-3xl font-bold mt-2">{stats.queriesTotal}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-[var(--color-on-surface-variant)]">
            Latencia media
          </p>
          <p className="text-3xl font-bold mt-2">
            {stats.avgLatencyMs > 0
              ? `${(stats.avgLatencyMs / 1000).toFixed(1)}s`
              : "—"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="stat-card lg:col-span-2 space-y-2">
          <p className="font-semibold">Motor RAG</p>
          <p className="text-sm text-[var(--color-on-surface-variant)]">
            Ollama: {stats.ollamaUrl} · Modelo: {stats.model}
          </p>
          {stats.documentsQueued > 0 && (
            <p className="text-sm text-[var(--color-warning-text)]">
              {stats.documentsQueued} documento(s) pendientes de indexación.
            </p>
          )}
        </div>
        <Link
          href="/chat"
          className="stat-card flex flex-col justify-center hover:border-[var(--color-citation-text)] transition-colors bg-[var(--color-surface-container-low)]"
        >
          <p className="font-semibold text-[var(--color-citation-text)]">
            Abrir asistente →
          </p>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
            Probar Regula con la documentación indexada.
          </p>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/admin/documents"
          className="stat-card hover:border-[var(--color-citation-text)] transition-colors"
        >
          <h2 className="font-semibold">Documentos</h2>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-2">
            Subir, categorizar, reindexar y eliminar.
          </p>
        </Link>
        <Link
          href="/admin/users"
          className="stat-card hover:border-[var(--color-citation-text)] transition-colors"
        >
          <h2 className="font-semibold">Usuarios</h2>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-2">
            Gestionar roles y accesos del tenant.
          </p>
        </Link>
        <Link
          href="/admin/analytics"
          className="stat-card hover:border-[var(--color-citation-text)] transition-colors"
        >
          <h2 className="font-semibold">Analytics</h2>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-2">
            Exportar consultas y latencias.
          </p>
        </Link>
      </div>
    </div>
  );
}
