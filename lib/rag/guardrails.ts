import type { UserRole } from "@/lib/db/schema";
import {
  greetingMessage,
  outOfScopeMessage,
  promptForQuestionMessage,
  thanksMessage,
  tooShortMessage,
  topicsHelpMessage,
  wellbeingMessage,
} from "@/lib/rag/messages";

const OUT_OF_SCOPE_PATTERNS = [
  /mundial|f[uú]tbol|copa am[eé]rica|messi|ronaldo/i,
  /clima|pron[oó]stico|temperatura (de )?hoy|llover[aá]/i,
  /(escribe|genera)(me)?\s+(c[oó]digo|codigo|un script|un programa)/i,
  /receta (de|para)|c[oó]mo cocinar|sancocho/i,
  /qui[eé]n (gan[oó]|invent[oó]) (el )?(mundial|oscar)/i,
  /\b(python|javascript|typescript|java|ruby)\b.*\b(ordenar|lista|c[oó]digo|funci[oó]n)\b/i,
  /\b(ordenar|generar)\b.*\b(python|javascript|c[oó]digo)\b/i,
  /traduce(r|me)?\s+al\s+(ingl[eé]s|franc[eé]s|alem[aá]n)/i,
  /bitcoin|criptomoneda|ethereum|precio del (bitcoin|d[oó]lar)/i,
  /cu[aá]l es el precio de/i,
];

const POLICY_KEYWORDS =
  /reglamento|pol[ií]tica|norma|procedimiento|vacaciones|horario|empresa|trabajador|empleado|permiso|desvinculaci[oó]n|uniforme|check-?in|early check-?in|hu[eé]sped|bodega|sst|teletrabajo|montacargas|epp|turno|jornada|conducta|beneficio|bono|justa causa|simulacro|confidencial|propina|vestimenta|dep[oó]sito|compensaci[oó]n|extra|ingreso|salida|tolerancia|tem[aá]tica|tema/i;

const GREETING_PATTERNS = [
  /^(hola|hey|hi|hello|buenos d[ií]as|buenas tardes|buenas noches|buen d[ií]a)\b/i,
  /^hola[\s,]+(c[oó]mo|como|qu[eé] tal|que tal)/i,
  /^(c[oó]mo|como|qu[eé] tal|que tal)\s+(est[aá]s|estas|te va|van|va)\b/i,
  /^(c[oó]mo|como)\s+(has|te ha)\s+(pasado|ido)\b/i,
  /^(qu[eé] tal|que tal)(\s+(tu|el)\s+(d[ií]a|día|fin de semana))?\b/i,
  /^gracias\b/i,
  /^(ok|vale|entendido|de acuerdo|perfecto|listo)\b/i,
];

const META_HELP_PATTERNS = [
  /qu[eé]\s+(tem[aá]ticas|temas|t[oó]picos)/i,
  /sobre\s+qu[eé]\s+(puedes|sabes|me puedes|consulto)/i,
  /en\s+qu[eé]\s+me\s+puedes\s+ayudar/i,
  /qu[eé]\s+puedes\s+(hacer|responder|consultar)/i,
  /qu[eé]\s+(documentos|informaci[oó]n)\s+tienes/i,
  /lista\s+de\s+temas/i,
];

export type GuardrailResult =
  | { allowed: true }
  | { allowed: false; reason: "out_of_scope"; message: string };

export function normalizeUserQuery(query: string): string {
  return query
    .trim()
    .replace(/^[¿¡]+/, "")
    .replace(/[?.!…]+$/g, "")
    .trim();
}

export function hasPolicyIntent(query: string): boolean {
  const trimmed = normalizeUserQuery(query);
  if (POLICY_KEYWORDS.test(trimmed)) return true;
  if (trimmed.includes("?") || trimmed.includes("¿")) return true;
  return /^(cu[aá]nto|cu[aá]l|cu[aá]les|c[oó]mo|como|d[oó]nde|donde|qu[eé]|que|puedo|se puede|hay|existe|cu[aá]ndo|cuando)\b/i.test(
    trimmed,
  );
}

export function detectConversational(
  query: string,
  tenantName: string,
): string | null {
  const trimmed = normalizeUserQuery(query);
  if (!trimmed) return null;

  if (/^gracias\b/i.test(trimmed)) {
    return thanksMessage(tenantName);
  }

  if (
    /^(c[oó]mo|como)\s+(has|te ha)\s+(pasado|ido)\b/i.test(trimmed) ||
    /^(c[oó]mo|como|qu[eé] tal|que tal)\s+(est[aá]s|estas|te va)\b/i.test(trimmed)
  ) {
    return wellbeingMessage(tenantName);
  }

  if (GREETING_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return greetingMessage(tenantName);
  }

  if (META_HELP_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return topicsHelpMessage(tenantName);
  }

  if (!hasPolicyIntent(trimmed) && trimmed.length <= 80) {
    return promptForQuestionMessage(tenantName);
  }

  return null;
}

export function checkScope(query: string, tenantName: string): GuardrailResult {
  const trimmed = normalizeUserQuery(query);
  if (trimmed.length < 3) {
    return {
      allowed: false,
      reason: "out_of_scope",
      message: tooShortMessage(),
    };
  }

  if (OUT_OF_SCOPE_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return {
      allowed: false,
      reason: "out_of_scope",
      message: outOfScopeMessage(tenantName),
    };
  }

  return { allowed: true };
}

export function canAccessChunk(
  userRole: UserRole,
  allowedRoles: string[],
): boolean {
  if (userRole === "super_admin" || userRole === "admin_empresa") {
    return true;
  }
  return allowedRoles.includes(userRole);
}
