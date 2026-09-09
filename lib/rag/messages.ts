import { ASSISTANT_NAME } from "@/lib/constants";

export function welcomeMessage(tenantName: string): string {
  return `Hola, soy ${ASSISTANT_NAME}, el asistente documental de ${tenantName}. Puedo ayudarte con reglamentos, políticas y procedimientos internos. Cuando responda con datos documentales, incluiré referencias a la fuente.`;
}

export function greetingMessage(tenantName: string): string {
  return `¡Hola! Me alegra saludarte. Soy ${ASSISTANT_NAME}, el asistente corporativo de ${tenantName}. Estoy muy bien y listo para ayudarte con horarios, vacaciones, teletrabajo, SST y más. ¿Qué te gustaría consultar hoy?`;
}

export function wellbeingMessage(tenantName: string): string {
  return `¡Muy bien, gracias por preguntar! Como asistente de ${tenantName} no tengo días buenos o malos, pero sí estoy disponible para orientarte con reglamentos y políticas internas. ¿En qué puedo ayudarte?`;
}

export function thanksMessage(tenantName: string): string {
  return `¡Con gusto! Si necesitas algo más sobre ${tenantName}, aquí estoy.`;
}

export function promptForQuestionMessage(tenantName: string): string {
  return `Cuéntame tu consulta sobre ${tenantName} con un poco más de detalle. Por ejemplo: "¿Cuál es el horario de entrada?" o "¿Cuántos días de vacaciones corresponden?".`;
}

export function topicsHelpMessage(tenantName: string): string {
  return `En ${tenantName} puedo ayudarte con temas como jornada laboral y horarios, vacaciones, teletrabajo, horas extras, seguridad y salud en el trabajo (SST), normas de bodega, uniforme y conducta, según la documentación indexada. ¿Sobre cuál te gustaría preguntar?`;
}

export function outOfScopeMessage(tenantName: string): string {
  return `Soy el asistente de ${tenantName} y solo puedo ayudarte con información interna de la empresa: reglamentos, políticas y procedimientos. Para otros temas no estoy habilitado, pero con gusto te apoyo si tu pregunta es sobre la organización.`;
}

export function tooShortMessage(): string {
  return "Escríbeme tu pregunta con un poco más de detalle sobre reglamentos o políticas de la empresa.";
}

export function noDocumentInfoMessage(tenantName: string): string {
  return `Revisé la documentación disponible de ${tenantName} y ese dato no aparece en los documentos que tengo indexados. Si lo necesitas con urgencia, te sugiero consultar con Talento Humano o tu supervisor directo.`;
}

export function noAccessibleInfoMessage(tenantName: string): string {
  return `Ese tema podría estar documentado en ${tenantName}, pero no está disponible para tu perfil en los archivos que puedo consultar. Si crees que deberías tener acceso, comunícate con Talento Humano o tu supervisor.`;
}

export function llmNoInfoInstruction(tenantName: string): string {
  return `Lo siento, no encontré ese dato en la documentación disponible de ${tenantName}.`;
}

function normalizeAnswerText(answer: string): string {
  return answer
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function isNoDocumentInfoAnswer(answer: string): boolean {
  const normalized = normalizeAnswerText(answer);

  return (
    normalized.includes("no encontre") ||
    normalized.includes("no aparece en los documentos") ||
    normalized.includes("no esta disponible en los documentos") ||
    normalized.includes("no encontre ese dato") ||
    normalized.includes("no se menciona") ||
    normalized.includes("no menciona") ||
    normalized.includes("no hay informacion sobre") ||
    normalized.includes("no se proporciona informacion")
  );
}

const QUESTION_STOPWORDS = new Set([
  "cual",
  "cuales",
  "cuanto",
  "cuantos",
  "como",
  "donde",
  "quien",
  "quiene",
  "hay",
  "para",
  "todos",
  "todas",
  "empleados",
  "empleado",
  "empresa",
  "otorga",
  "ofrece",
  "gratuito",
  "gratuita",
  "interna",
  "interno",
  "politica",
  "reglamento",
]);

function normalizeTerms(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function extractQuestionTerms(question: string): string[] {
  return normalizeTerms(question)
    .split(/\s+/)
    .filter((word) => word.length >= 5 && !QUESTION_STOPWORDS.has(word));
}

export function contextMatchesQuestion(
  question: string,
  contextText: string,
): boolean {
  const terms = extractQuestionTerms(question);
  if (terms.length === 0) return true;

  const normalizedContext = normalizeTerms(contextText);
  return terms.some((term) => normalizedContext.includes(term));
}
