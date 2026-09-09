import Link from "next/link";
import { LandingHeader } from "@/components/landing/landing-header";
import { Logo } from "@/components/brand/logo";
import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_TAGLINE,
  ASSISTANT_NAME,
} from "@/lib/constants";

const features = [
  {
    title: "Multi-empresa aislada",
    description:
      "Cada organización consulta solo su documentación. Cero fugas entre tenants verificadas con pruebas automatizadas.",
  },
  {
    title: "Respuestas con citas",
    description:
      "Cada afirmación referencia el fragmento documental original: documento, sección y score de similitud.",
  },
  {
    title: "Control por rol",
    description:
      "Empleados, supervisores y RH acceden únicamente a la información autorizada para su perfil.",
  },
  {
    title: "Back-office completo",
    description:
      "Sube PDF, DOCX o Markdown, reindexa, gestiona usuarios y exporta métricas desde un panel unificado.",
  },
];

const steps = [
  {
    step: "01",
    title: "Indexa tu base documental",
    text: "Carga reglamentos, políticas y procedimientos. El pipeline los fragmenta y vectoriza automáticamente.",
  },
  {
    step: "02",
    title: "Consulta en lenguaje natural",
    text: `${ASSISTANT_NAME} recupera contexto relevante y responde con trazabilidad sobre la documentación de tu empresa.`,
  },
  {
    step: "03",
    title: "Audita y escala",
    text: "Exporta consultas, evalúa precisión con 40 preguntas de prueba y administra múltiples empresas desde un solo lugar.",
  },
];

export function LandingPage() {
  return (
    <div className="relative min-h-dvh bg-[var(--color-background)] text-[var(--color-on-background)] overflow-x-hidden">
      <div className="hero-glow absolute inset-0 pointer-events-none" />

      <LandingHeader />

      <main className="relative z-10">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-16 sm:pt-16 sm:pb-20 md:pt-24 md:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-label-sm text-[var(--color-citation-text)]">
                {APP_TAGLINE}
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                Consulta reglamentos y políticas con{" "}
                <span className="text-[var(--color-secondary)]">{ASSISTANT_NAME}</span>
              </h1>
              <p className="text-lg text-[var(--color-on-surface-variant)] max-w-xl leading-relaxed">
                {APP_DESCRIPTION} Diseñado para equipos de Talento Humano,
                compliance y operaciones que necesitan respuestas rápidas, citadas
                y seguras por empresa.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center rounded-xl bg-[var(--color-secondary)] px-6 text-sm font-semibold text-white hover:opacity-95 transition-opacity"
                >
                  Probar {APP_NAME}
                </Link>
                <a
                  href="#producto"
                  className="inline-flex h-12 items-center rounded-xl border border-[var(--color-outline-variant)] bg-white px-6 text-sm font-medium hover:border-[var(--color-citation-text)] transition-colors"
                >
                  Ver capacidades
                </a>
              </div>
              <div className="flex flex-wrap gap-6 pt-4 text-sm text-[var(--color-on-surface-variant)]">
                <div>
                  <p className="text-2xl font-bold text-[var(--color-on-surface)]">97.5%</p>
                  <p>precisión evaluación</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--color-on-surface)]">2+</p>
                  <p>empresas demo</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--color-on-surface)]">100%</p>
                  <p>respuestas trazables</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-5 sm:p-8 md:p-10 space-y-6">
              <div className="flex justify-center">
                <div className="assistant-orb h-24 w-24 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  R
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-headline-md">
                  Hola, soy <span className="text-[var(--color-citation-text)]">{ASSISTANT_NAME}</span>
                </p>
                <p className="text-body-md text-[var(--color-on-surface-variant)]">
                  ¿Cuál es el horario de entrada? ¿Cuántos días de vacaciones
                  corresponden? Pregúntame sobre tu reglamento interno.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-4 space-y-3">
                <p className="text-xs text-[var(--color-on-surface-variant)]">
                  Ejemplo de consulta
                </p>
                <p className="text-sm">
                  ¿Puedo teletrabajar los viernes según la política vigente?
                </p>
                <div className="rounded-xl bg-white border border-[var(--color-citation-border)] p-3 text-sm">
                  Según el Reglamento Interno, el teletrabajo requiere
                  autorización previa del jefe inmediato{" "}
                  <span className="citation-chip">[1]</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="producto" className="bg-white border-y border-[var(--color-outline-variant)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-label-sm text-[var(--color-citation-text)]">Producto</p>
              <h2 className="text-2xl sm:text-3xl font-bold mt-2">
                Todo lo que necesitas para vender y operar RAG corporativo
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature) => (
                <div key={feature.title} className="stat-card space-y-2">
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-label-sm text-[var(--color-citation-text)]">Proceso</p>
            <h2 className="text-2xl sm:text-3xl font-bold mt-2">De documentos a respuestas en minutos</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((item) => (
              <div key={item.step} className="glass-panel p-6 space-y-3">
                <span className="text-3xl font-bold text-[var(--color-secondary-container)]">
                  {item.step}
                </span>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-[var(--color-on-surface-variant)]">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="empresas" className="bg-[var(--color-inverse-surface)] text-[var(--color-inverse-on-surface)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold">
              Listo para tu próxima demo comercial
            </h2>
            <p className="text-[var(--color-inverse-on-surface)]/80 max-w-2xl mx-auto">
              {APP_NAME} combina chat inteligente, panel administrativo y
              evaluación documentada. Ideal para propuestas de transformación
              digital en logística, turismo, servicios y cualquier sector
              regulado.
            </p>
            <Link
              href="/login"
              className="inline-flex h-12 items-center rounded-xl bg-[var(--color-secondary)] px-8 text-sm font-semibold text-white hover:opacity-95"
            >
              Entrar al workspace
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[var(--color-outline-variant)] bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--color-on-surface-variant)] safe-bottom">
          <Logo size="sm" />
          <p>© {new Date().getFullYear()} {APP_NAME}. Prototipo académico multi-tenant RAG.</p>
        </div>
      </footer>
    </div>
  );
}
