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
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <p className="text-label-sm text-[var(--color-on-surface-variant)]">
            Panel de administración
          </p>
          <h1 className="text-headline-md mt-1">{session.tenantName}</h1>
          <p className="text-body-md text-[var(--color-on-surface-variant)] mt-2">
            Gestiona la base documental de tu empresa. Cada documento que subes o
            reindexas alimenta el asistente RAG con nuevos fragmentos vectorizados.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card-surface p-4">
            <p className="text-xs text-[var(--color-on-surface-variant)]">
              Documentos vectorizados
            </p>
            <p className="text-2xl font-semibold mt-1">
              {stats.documentsVectorized}/{stats.documentsTotal}
            </p>
            {stats.documentsError > 0 && (
              <p className="text-xs text-red-600 mt-1">
                {stats.documentsError} con error
              </p>
            )}
          </div>
          <div className="card-surface p-4">
            <p className="text-xs text-[var(--color-on-surface-variant)]">
              Chunks indexados
            </p>
            <p className="text-2xl font-semibold mt-1">{stats.chunksTotal}</p>
          </div>
          <div className="card-surface p-4">
            <p className="text-xs text-[var(--color-on-surface-variant)]">
              Consultas registradas
            </p>
            <p className="text-2xl font-semibold mt-1">{stats.queriesTotal}</p>
            {stats.avgLatencyMs > 0 && (
              <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">
                ~{(stats.avgLatencyMs / 1000).toFixed(1)}s media
              </p>
            )}
          </div>
        </div>

        <div className="card-surface p-4 text-sm space-y-1">
          <p className="font-medium">Agente RAG de tu empresa</p>
          <p className="text-[var(--color-on-surface-variant)]">
            Ollama: {stats.ollamaUrl} · Modelo: {stats.model}
          </p>
          {stats.documentsQueued > 0 && (
            <p className="text-amber-700">
              {stats.documentsQueued} documento(s) pendientes — contacta al super
              admin o ejecuta ingestión.
            </p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/admin/documents"
            className="card-surface p-5 hover:border-[var(--color-citation-text)] transition-colors"
          >
            <h2 className="font-semibold">Documentos</h2>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-2">
              Subir Markdown, categorizar, reindexar y eliminar.
            </p>
          </Link>
          <Link
            href="/admin/users"
            className="card-surface p-5 hover:border-[var(--color-citation-text)] transition-colors"
          >
            <h2 className="font-semibold">Usuarios</h2>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-2">
              Ver usuarios y roles de la empresa.
            </p>
          </Link>
          <Link
            href="/admin/analytics"
            className="card-surface p-5 hover:border-[var(--color-citation-text)] transition-colors"
          >
            <h2 className="font-semibold">Analytics</h2>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-2">
              Exportar consultas y latencias de tu tenant.
            </p>
          </Link>
          <Link
            href="/chat"
            className="card-surface p-5 hover:border-[var(--color-citation-text)] transition-colors"
          >
            <h2 className="font-semibold">Chat RAG</h2>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-2">
              Probar el asistente con la documentación indexada.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
