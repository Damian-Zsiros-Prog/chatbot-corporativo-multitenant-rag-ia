export type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

const MAX_HISTORY_MESSAGES = 20;

export function trimConversationHistory(
  history: ChatHistoryMessage[],
): ChatHistoryMessage[] {
  return history
    .filter((item) => item.content.trim().length > 0)
    .slice(-MAX_HISTORY_MESSAGES);
}

export function formatHistoryForPrompt(history: ChatHistoryMessage[]): string {
  if (history.length === 0) return "";

  const lines = history.map((item) => {
    const label = item.role === "user" ? "Usuario" : "Asistente";
    return `${label}: ${item.content.trim()}`;
  });

  return `HISTORIAL RECIENTE DE LA CONVERSACIÓN:\n${lines.join("\n\n")}\n\n`;
}
