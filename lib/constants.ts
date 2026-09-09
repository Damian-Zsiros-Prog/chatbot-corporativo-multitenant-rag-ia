export const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME ?? "Chatbot Corporativo RAG";

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
