export function welcomeMessage(tenantName: string): string {
  return `Hola. Soy el asistente de consultas de ${tenantName}. Estoy aquí para ayudarte con reglamentos, políticas y procedimientos internos. Cuando responda con datos documentales, incluiré referencias a la fuente.`;
}

export function greetingMessage(tenantName: string): string {
  return `¡Hola! Me alegra saludarte. Soy el asistente corporativo de ${tenantName} y puedo orientarte sobre horarios, vacaciones, teletrabajo, seguridad en el trabajo y más. ¿Qué te gustaría consultar hoy?`;
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

export function isNoDocumentInfoAnswer(answer: string): boolean {
  const normalized = answer
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  return (
    normalized.includes("no encontre") ||
    normalized.includes("no aparece en los documentos") ||
    normalized.includes("no esta disponible en los documentos") ||
    normalized.includes("no encontre ese dato")
  );
}
