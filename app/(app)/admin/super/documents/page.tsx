import { DocumentsAdmin } from "@/components/admin/documents-admin";
import { getSession } from "@/lib/auth/session";

export default async function SuperAdminDocumentsPage() {
  const session = await getSession();

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <p className="text-label-sm text-[var(--color-on-surface-variant)]">
            Plataforma — todas las empresas
          </p>
          <h1 className="text-headline-md mt-1">Documentos globales</h1>
          <p className="text-body-md text-[var(--color-on-surface-variant)] mt-2">
            Gestiona la base documental de cada tenant. Al subir, indica la
            empresa destino en el formulario.
          </p>
        </div>
        <DocumentsAdmin session={session!} showTenantColumn />
      </div>
    </div>
  );
}
