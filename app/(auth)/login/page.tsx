import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-background)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#dce9ff_0%,_transparent_50%)] pointer-events-none" />
      <LoginForm nextPath={params.next} />
    </div>
  );
}
