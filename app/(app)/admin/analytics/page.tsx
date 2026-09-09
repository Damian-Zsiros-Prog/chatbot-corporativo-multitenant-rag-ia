import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function AdminAnalyticsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.role === "super_admin") {
    redirect("/admin/super/analytics");
  }

  if (session.role !== "admin_empresa") {
    redirect("/chat");
  }

  return (
    <div className="max-w-2xl mx-auto card-surface p-4 sm:p-6 space-y-4">
        <div>
          <p className="text-label-sm text-[var(--color-on-surface-variant)]">
            {session.tenantName}
          </p>
          <h1 className="text-headline-md mt-1">Exportar consultas</h1>
          <p className="text-body-md text-[var(--color-on-surface-variant)] mt-2">
            Descarga el registro de preguntas, respuestas, scores y latencias de
            tu empresa.
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
