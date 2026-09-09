import { redirect } from "next/navigation";
import { getHomeRedirect } from "@/lib/auth/post-login-redirect";
import { getSession } from "@/lib/auth/session";

export default async function HomePage() {
  const session = await getSession();
  redirect(session ? getHomeRedirect(session.role) : "/login");
}
