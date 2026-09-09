import { redirect } from "next/navigation";
import { UsersAdmin } from "@/components/admin/users-admin";
import { requireAdmin } from "@/lib/admin/require-admin";

export default async function AdminUsersPage() {
  const session = await requireAdmin();
  if (!session) redirect("/login");

  if (session.role === "super_admin") {
    redirect("/admin/super/users");
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <p className="text-label-sm text-[var(--color-on-surface-variant)]">
            {session.tenantName}
          </p>
          <h1 className="text-headline-md mt-1">Usuarios</h1>
          <p className="text-body-md text-[var(--color-on-surface-variant)] mt-2">
            Crea usuarios con roles para tu empresa. Cada rol define qué
            documentos puede consultar el asistente RAG.
          </p>
        </div>
        <UsersAdmin
          session={session}
          fixedTenantSlug={session.tenantSlug}
          title={`Nuevo usuario · ${session.tenantName}`}
        />
      </div>
    </div>
  );
}
