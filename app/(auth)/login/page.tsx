import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/brand/logo";
import { APP_DESCRIPTION, APP_TAGLINE, ASSISTANT_NAME } from "@/lib/constants";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <div className="min-h-dvh grid lg:grid-cols-2 bg-[var(--color-background)]">
      <div className="hidden lg:flex flex-col justify-between p-12 hero-glow relative overflow-hidden">
        <Link href="/">
          <Logo />
        </Link>
        <div className="space-y-6 max-w-md">
          <p className="text-label-sm text-[var(--color-citation-text)]">
            {APP_TAGLINE}
          </p>
          <h1 className="text-4xl font-bold tracking-tight leading-tight">
            Accede al workspace de{" "}
            <span className="text-[var(--color-secondary)]">{ASSISTANT_NAME}</span>
          </h1>
          <p className="text-[var(--color-on-surface-variant)] leading-relaxed">
            {APP_DESCRIPTION}
          </p>
          <div className="glass-panel p-5 text-sm space-y-2">
            <p className="font-medium">Incluye por empresa</p>
            <ul className="text-[var(--color-on-surface-variant)] space-y-1 list-disc list-inside">
              <li>Chat con citas documentales</li>
              <li>Panel de documentos y usuarios</li>
              <li>Exportación de métricas RAG</li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-[var(--color-on-surface-variant)]">
          ¿Primera vez?{" "}
          <Link href="/" className="text-[var(--color-citation-text)] hover:underline">
            Conoce el producto
          </Link>
        </p>
      </div>

      <div className="flex items-center justify-center p-4 sm:p-6 relative safe-bottom">
        <div className="absolute inset-0 lg:hidden hero-glow pointer-events-none" />
        <div className="relative w-full max-w-md">
          <div className="lg:hidden mb-6 flex justify-center">
            <Logo />
          </div>
          <LoginForm nextPath={params.next} />
        </div>
      </div>
    </div>
  );
}
