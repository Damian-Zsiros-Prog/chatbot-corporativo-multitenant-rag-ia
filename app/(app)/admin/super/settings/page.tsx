import { getPlatformStats } from "@/lib/admin/tenant-overview";

export default async function SuperAdminSettingsPage() {
  const stats = await getPlatformStats();

  const configItems = [
    { label: "Ollama URL", value: stats.ollamaUrl },
    { label: "Modelo LLM", value: stats.model },
    { label: "Modelo embeddings", value: stats.embedModel },
    { label: "RAG min score", value: stats.ragMinScore },
    { label: "RAG top K", value: stats.ragTopK },
    { label: "Base de datos", value: process.env.DATABASE_PATH ?? "./data/chatbot.db" },
    { label: "Storage", value: process.env.STORAGE_PATH ?? "./storage" },
  ];

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <p className="text-label-sm text-[var(--color-on-surface-variant)]">
            Plataforma
          </p>
          <h1 className="text-headline-md mt-1">Configuración general</h1>
          <p className="text-body-md text-[var(--color-on-surface-variant)] mt-2">
            Parámetros del agente RAG y del entorno. Edita{" "}
            <code className="font-mono text-sm">.env.local</code> y reinicia la
            app para aplicar cambios.
          </p>
        </div>

        <div className="card-surface divide-y divide-[var(--color-outline-variant)]">
          {configItems.map((item) => (
            <div
              key={item.label}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-4"
            >
              <span className="text-sm text-[var(--color-on-surface-variant)]">
                {item.label}
              </span>
              <code className="text-sm font-mono">{item.value}</code>
            </div>
          ))}
        </div>

        <div className="card-surface p-5 space-y-3 text-sm">
          <p className="font-semibold">Comandos de mantenimiento</p>
          <code className="block font-mono bg-[var(--color-surface-container)] p-3 rounded-md">
            pnpm setup
          </code>
          <p className="text-[var(--color-on-surface-variant)]">
            db:push + seed + ingest --all + verificación Ollama
          </p>
          <code className="block font-mono bg-[var(--color-surface-container)] p-3 rounded-md">
            pnpm ingest --all
          </code>
          <p className="text-[var(--color-on-surface-variant)]">
            Reindexar todos los documentos de todas las empresas
          </p>
        </div>
      </div>
    </div>
  );
}
