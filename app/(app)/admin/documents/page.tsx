import { redirect } from "next/navigation";
import { DocumentsAdmin } from "@/components/admin/documents-admin";
import { getSession } from "@/lib/auth/session";

export default async function AdminDocumentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.role === "super_admin") {
    redirect("/admin/super/documents");
  }

  if (session.role !== "admin_empresa") {
    redirect("/chat");
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <p className="text-label-sm text-[var(--color-on-surface-variant)]">
            {session.tenantName}
          </p>
          <h1 className="text-headline-md mt-1">Documentos corporativos</h1>
        </div>
        <DocumentsAdmin session={session} />
      </div>
    </div>
  );
}
