export default async function SuperAdminAnalyticsPage() {
  return (
    <div className="max-w-2xl mx-auto card-surface p-4 sm:p-6 space-y-4">
        <div>
          <p className="text-label-sm text-[var(--color-on-surface-variant)]">
            Plataforma
          </p>
          <h1 className="text-headline-md mt-1">Analytics global</h1>
          <p className="text-body-md text-[var(--color-on-surface-variant)] mt-2">
            Exporta consultas de todas las empresas para el capítulo de
            resultados de la tesis.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href="/api/analytics/export?format=json"
            className="inline-flex h-10 items-center rounded-md bg-[var(--color-secondary)] px-4 text-sm font-medium text-[var(--color-on-secondary)]"
          >
            Descargar JSON
          </a>
          <a
            href="/api/analytics/export?format=csv"
            className="inline-flex h-10 items-center rounded-md border border-[var(--color-outline-variant)] px-4 text-sm font-medium"
          >
            Descargar CSV
          </a>
        </div>
    </div>
  );
}
