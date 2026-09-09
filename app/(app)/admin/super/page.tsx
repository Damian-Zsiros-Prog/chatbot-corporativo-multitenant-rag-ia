import Link from "next/link";
import {
  getPlatformStats,
  getTenantsOverview,
} from "@/lib/admin/tenant-overview";
import { getLatestEvaluationReport } from "@/lib/evaluation/latest-report";

export default async function SuperAdminPage() {
  const [stats, tenants, evaluation] = await Promise.all([
    getPlatformStats(),
    getTenantsOverview(),
    Promise.resolve(getLatestEvaluationReport()),
  ]);

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <p className="text-label-sm text-[var(--color-on-surface-variant)]">
            Administración de plataforma
          </p>
          <h1 className="text-headline-md mt-1">Multi-tenant RAG</h1>
          <p className="text-body-md text-[var(--color-on-surface-variant)] mt-2">
            Configura empresas, documentación y el agente RAG para todas las
            organizaciones del sistema.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card-surface p-4">
            <p className="text-xs text-[var(--color-on-surface-variant)]">
              Empresas
            </p>
            <p className="text-2xl font-semibold mt-1">{stats.tenantsCount}</p>
          </div>
          <div className="card-surface p-4">
            <p className="text-xs text-[var(--color-on-surface-variant)]">
              Documentos vectorizados
            </p>
            <p className="text-2xl font-semibold mt-1">
              {stats.documentsVectorized}/{stats.documentsTotal}
            </p>
          </div>
          <div className="card-surface p-4">
            <p className="text-xs text-[var(--color-on-surface-variant)]">
              Chunks indexados
            </p>
            <p className="text-2xl font-semibold mt-1">{stats.chunksTotal}</p>
          </div>
          <div className="card-surface p-4">
            <p className="text-xs text-[var(--color-on-surface-variant)]">
              Evaluación RAG
            </p>
            <p className="text-2xl font-semibold mt-1">
              {evaluation ? `${evaluation.summary.pass_rate}%` : "—"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/admin/super/tenants"
            className="card-surface p-5 hover:border-[var(--color-citation-text)] transition-colors"
          >
            <h2 className="font-semibold">Crear empresa</h2>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-2">
              Alta de nuevos tenants aislados en la plataforma.
            </p>
          </Link>
          <Link
            href="/admin/super/users"
            className="card-surface p-5 hover:border-[var(--color-citation-text)] transition-colors"
          >
            <h2 className="font-semibold">Crear usuarios</h2>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-2">
              Asigna roles por empresa: empleado, supervisor, RH, admin.
            </p>
          </Link>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-title-md font-semibold">Empresas registradas</h2>
            <Link
              href="/admin/super/settings"
              className="text-sm text-[var(--color-citation-text)]"
            >
              Configuración global
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {tenants.map((tenant) => (
              <div key={tenant.id} className="card-surface p-5 space-y-3">
                <div>
                  <h3 className="font-semibold">{tenant.name}</h3>
                  <p className="text-sm text-[var(--color-on-surface-variant)]">
                    {tenant.sector}
                  </p>
                  {tenant.description && (
                    <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
                      {tenant.description}
                    </p>
                  )}
                </div>

                <dl className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <dt className="text-[var(--color-on-surface-variant)]">
                      Usuarios
                    </dt>
                    <dd className="font-medium">{tenant.usersCount}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--color-on-surface-variant)]">
                      Docs
                    </dt>
                    <dd className="font-medium">
                      {tenant.documentsVectorized}/{tenant.documentsTotal}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--color-on-surface-variant)]">
                      Chunks
                    </dt>
                    <dd className="font-medium">{tenant.chunksTotal}</dd>
                  </div>
                </dl>

                <p className="text-xs font-mono text-[var(--color-on-surface-variant)]">
                  slug: {tenant.slug}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="card-surface p-5 text-sm space-y-2">
          <p className="font-semibold">Agente RAG (global)</p>
          <p className="text-[var(--color-on-surface-variant)]">
            Ollama: {stats.ollamaUrl} · LLM: {stats.model} · Embeddings:{" "}
            {stats.embedModel}
          </p>
          <p className="text-[var(--color-on-surface-variant)]">
            RAG_MIN_SCORE={stats.ragMinScore} · RAG_TOP_K={stats.ragTopK}
          </p>
        </div>
      </div>
    </div>
  );
}
