import Link from "next/link";
import { getLatestEvaluationReport } from "@/lib/evaluation/latest-report";

export default async function SuperAdminEvaluationPage() {
  const report = getLatestEvaluationReport();
  const mdFileName = report?.fileName.replace(".json", ".md");

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <p className="text-label-sm text-[var(--color-on-surface-variant)]">
            Plataforma — Fase 7
          </p>
          <h1 className="text-headline-md mt-1">Evaluación RAG</h1>
          <p className="text-body-md text-[var(--color-on-surface-variant)] mt-2">
            Batería de 40 preguntas contra todas las empresas demo.
          </p>
        </div>

        <div className="card-surface p-5 space-y-3">
          <p className="font-semibold">Ejecutar evaluación completa</p>
          <code className="block text-sm font-mono bg-[var(--color-surface-container)] p-3 rounded-md">
            pnpm evaluate
          </code>
          <p className="text-sm text-[var(--color-on-surface-variant)]">
            Aislamiento multi-tenant:{" "}
            <code className="font-mono">pnpm test:tenant-isolation</code>
          </p>
          <p className="text-xs text-[var(--color-on-surface-variant)]">
            La evaluación completa (~40 preguntas) debe ejecutarse en local por
            latencia de Ollama. Los reportes generados aparecen abajo para
            descarga.
          </p>
        </div>

        {report ? (
          <div className="card-surface p-5 space-y-4">
            <div>
              <p className="font-semibold">Último reporte</p>
              <p className="text-sm text-[var(--color-on-surface-variant)]">
                {report.fileName}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border border-[var(--color-outline-variant)] p-3">
                <p className="text-xs text-[var(--color-on-surface-variant)]">
                  Aciertos
                </p>
                <p className="text-2xl font-semibold">
                  {report.summary.passed}/{report.summary.total}
                </p>
                <p className="text-sm">{report.summary.pass_rate}%</p>
              </div>
              <div className="rounded-md border border-[var(--color-outline-variant)] p-3">
                <p className="text-xs text-[var(--color-on-surface-variant)]">
                  Latencia media
                </p>
                <p className="text-2xl font-semibold">
                  {(report.summary.avg_latency_ms / 1000).toFixed(1)}s
                </p>
              </div>
              <div className="rounded-md border border-[var(--color-outline-variant)] p-3">
                <p className="text-xs text-[var(--color-on-surface-variant)]">
                  Latencia p95
                </p>
                <p className="text-2xl font-semibold">
                  {report.summary.p95_latency_ms
                    ? `${(report.summary.p95_latency_ms / 1000).toFixed(1)}s`
                    : "—"}
                </p>
              </div>
              <div className="rounded-md border border-[var(--color-outline-variant)] p-3">
                <p className="text-xs text-[var(--color-on-surface-variant)]">
                  Fallos
                </p>
                <p className="text-2xl font-semibold">{report.summary.failed}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/api/admin/evaluation/reports/${report.fileName}`}
                className="inline-flex h-10 items-center rounded-md bg-[var(--color-secondary)] px-4 text-sm font-medium text-[var(--color-on-secondary)]"
              >
                Descargar JSON
              </Link>
              {mdFileName ? (
                <Link
                  href={`/api/admin/evaluation/reports/${mdFileName}?format=md`}
                  className="inline-flex h-10 items-center rounded-md border border-[var(--color-outline-variant)] px-4 text-sm font-medium"
                >
                  Descargar informe MD
                </Link>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="card-surface p-5 text-sm text-[var(--color-on-surface-variant)]">
            Aún no hay reportes. Ejecuta{" "}
            <code className="font-mono">pnpm evaluate</code>.
          </div>
        )}
      </div>
    </div>
  );
}
