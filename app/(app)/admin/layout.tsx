import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getSession } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAdmin =
    session.role === "admin_empresa" || session.role === "super_admin";
  if (!isAdmin) redirect("/chat");

  return <AdminShell session={session}>{children}</AdminShell>;
}
