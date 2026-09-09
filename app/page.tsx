import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/landing-page";
import { getHomeRedirect } from "@/lib/auth/post-login-redirect";
import { getSession } from "@/lib/auth/session";

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    redirect(getHomeRedirect(session.role));
  }

  return <LandingPage />;
}
