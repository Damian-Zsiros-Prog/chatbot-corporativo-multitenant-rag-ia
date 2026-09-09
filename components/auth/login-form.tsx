"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { APP_NAME, DEMO_PASSWORD, LEGAL_DISCLAIMER } from "@/lib/constants";

type TenantOption = {
  slug: string;
  name: string;
  sector: string;
};

type LoginMode = "tenant" | "platform";

type LoginFormProps = {
  nextPath?: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("tenant");
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [tenantSlug, setTenantSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/tenants")
      .then((res) => res.json())
      .then((data: { tenants: TenantOption[] }) => {
        setTenants(data.tenants ?? []);
        if (data.tenants?.[0]) {
          setTenantSlug(data.tenants[0].slug);
        }
      })
      .catch(() => setError("No se pudo cargar la lista de empresas"));
  }, []);

  useEffect(() => {
    if (mode === "platform") {
      setEmail("super@demo.local");
    } else {
      setEmail((current) => (current === "super@demo.local" ? "" : current));
    }
  }, [mode]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          mode,
          tenantSlug: mode === "tenant" ? tenantSlug : undefined,
          nextPath,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Error al iniciar sesión");
        return;
      }

      router.push(data.redirectTo ?? "/chat");
      router.refresh();
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card-surface w-full max-w-md p-8 space-y-6"
    >
      <div className="space-y-2">
        <p className="text-label-sm text-[var(--color-on-surface-variant)]">
          Acceso corporativo
        </p>
        <h1 className="text-display-lg text-[var(--color-on-surface)]">
          {APP_NAME}
        </h1>
        <p className="text-body-md text-[var(--color-on-surface-variant)]">
          {mode === "platform"
            ? "Administración global de empresas y configuración RAG."
            : "Consulta de reglamentos y políticas con respaldo documental."}
        </p>
      </div>

      <div className="flex rounded-lg border border-[var(--color-outline-variant)] p-1 bg-[var(--color-surface-container-low)]">
        <button
          type="button"
          onClick={() => setMode("tenant")}
          className={`flex-1 py-2 text-sm rounded-md transition-colors ${
            mode === "tenant"
              ? "bg-white shadow-sm font-medium"
              : "text-[var(--color-on-surface-variant)]"
          }`}
        >
          Empresa
        </button>
        <button
          type="button"
          onClick={() => setMode("platform")}
          className={`flex-1 py-2 text-sm rounded-md transition-colors ${
            mode === "platform"
              ? "bg-white shadow-sm font-medium"
              : "text-[var(--color-on-surface-variant)]"
          }`}
        >
          Super administrador
        </button>
      </div>

      <div className="space-y-4">
        {mode === "tenant" ? (
          <label className="block space-y-1.5">
            <span className="text-label-sm text-[var(--color-on-surface-variant)]">
              Empresa
            </span>
            <select
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value)}
              className="w-full h-11 rounded-md border border-[var(--color-outline-variant)] bg-white px-3 text-sm"
              required
            >
              {tenants.length === 0 ? (
                <option value="">Sin empresas — ejecuta pnpm db:seed</option>
              ) : (
                tenants.map((tenant) => (
                  <option key={tenant.slug} value={tenant.slug}>
                    {tenant.name} ({tenant.sector})
                  </option>
                ))
              )}
            </select>
          </label>
        ) : (
          <div className="rounded-md bg-[var(--color-surface-container-low)] p-3 text-sm text-[var(--color-on-surface-variant)]">
            Acceso a la plataforma multi-tenant: gestión de todas las empresas,
            evaluación RAG y configuración global.
          </div>
        )}

        <label className="block space-y-1.5">
          <span className="text-label-sm text-[var(--color-on-surface-variant)]">
            Correo
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={
              mode === "platform"
                ? "super@demo.local"
                : "admin@logistica.demo"
            }
            className="w-full h-11 rounded-md border border-[var(--color-outline-variant)] bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-citation-text)] focus:ring-offset-2"
            required
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-label-sm text-[var(--color-on-surface-variant)]">
            Contraseña
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 rounded-md border border-[var(--color-outline-variant)] bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-citation-text)] focus:ring-offset-2"
            required
          />
        </label>
      </div>

      {error ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full"
        disabled={loading || (mode === "tenant" && !tenantSlug)}
      >
        {loading
          ? "Ingresando..."
          : mode === "platform"
            ? "Ingresar a plataforma"
            : "Ingresar"}
      </Button>

      <div className="rounded-md bg-[var(--color-surface-container-low)] p-4 space-y-2">
        <p className="text-label-sm text-[var(--color-on-surface-variant)]">
          Usuarios demo
        </p>
        <ul className="text-body-md text-[var(--color-on-surface-variant)] space-y-1 text-sm">
          {mode === "platform" ? (
            <>
              <li>Super admin: super@demo.local</li>
              <li>Contraseña: {DEMO_PASSWORD}</li>
            </>
          ) : (
            <>
              <li>Empleado: empleado@logistica.demo / empleado@hotel.demo</li>
              <li>Admin empresa: admin@logistica.demo / admin@hotel.demo</li>
              <li>RH: rh@logistica.demo / rh@hotel.demo</li>
              <li>Contraseña: {DEMO_PASSWORD}</li>
            </>
          )}
        </ul>
      </div>

      <p className="text-center text-[11px] text-[var(--color-on-surface-variant)] leading-relaxed">
        {LEGAL_DISCLAIMER}
      </p>
    </form>
  );
}
