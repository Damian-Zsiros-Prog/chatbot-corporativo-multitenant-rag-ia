import { redirect } from "next/navigation";
import { getHomeRedirect } from "@/lib/auth/post-login-redirect";
import { getSession } from "@/lib/auth/session";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "super_admin") {
    redirect(getHomeRedirect(session.role));
  }

  return children;
}
