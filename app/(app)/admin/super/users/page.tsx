import { UsersAdmin } from "@/components/admin/users-admin";
import { getSession } from "@/lib/auth/session";

export default async function SuperAdminUsersPage() {
  const session = await getSession();

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <p className="text-label-sm text-[var(--color-on-surface-variant)]">
            Plataforma
          </p>
          <h1 className="text-headline-md mt-1">Usuarios</h1>
          <p className="text-body-md text-[var(--color-on-surface-variant)] mt-2">
            Crea usuarios con roles para cualquier empresa del sistema.
          </p>
        </div>
        <UsersAdmin
          session={session!}
          showTenantColumn
          showTenantFilter
          title="Nuevo usuario (elegir empresa)"
        />
      </div>
    </div>
  );
}
