import { TenantsAdmin } from "@/components/admin/tenants-admin";

export default function SuperAdminTenantsPage() {
  return (
    <div className="page-container max-w-5xl space-y-6">
        <div>
          <p className="text-label-sm text-[var(--color-on-surface-variant)]">
            Plataforma
          </p>
          <h1 className="text-headline-md mt-1">Empresas</h1>
          <p className="text-body-md text-[var(--color-on-surface-variant)] mt-2">
            Crea nuevos tenants aislados. Cada empresa tiene su propia base
            documental, usuarios y chunks vectoriales.
          </p>
        </div>
        <TenantsAdmin />
    </div>
  );
}
