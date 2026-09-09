export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "RegulaDesk";

export const APP_TAGLINE =
  process.env.NEXT_PUBLIC_APP_TAGLINE ??
  "Inteligencia documental corporativa";

export const ASSISTANT_NAME =
  process.env.NEXT_PUBLIC_ASSISTANT_NAME ?? "Regula";

export const APP_DESCRIPTION =
  "Plataforma multi-tenant con RAG para consultar reglamentos, políticas y procedimientos internos con trazabilidad y citas documentales.";

export const DEMO_PASSWORD = "demo123";

export const LEGAL_DISCLAIMER =
  "Este asistente no sustituye la lectura oficial del reglamento ni constituye asesoría legal. Verifica siempre en el documento fuente.";

export const ALL_ROLES = [
  "empleado",
  "supervisor",
  "rh",
  "admin_empresa",
  "super_admin",
] as const;

export const PUBLIC_ROLES = ["empleado", "supervisor", "rh"] as const;

export const QUICK_PROMPTS = [
  "¿Cuál es el horario de entrada?",
  "¿Cuántos días de vacaciones tengo?",
  "Política de teletrabajo",
  "Normas de seguridad SST",
  "Código de conducta",
  "Procedimientos de la empresa",
] as const;
