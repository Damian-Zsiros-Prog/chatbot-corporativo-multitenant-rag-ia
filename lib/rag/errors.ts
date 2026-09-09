export function toUserFacingError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (
    lower.includes("fetch failed") ||
    lower.includes("econnrefused") ||
    lower.includes("network")
  ) {
    return "No se pudo conectar con Ollama. Verifica que el servicio esté activo y que OLLAMA_BASE_URL sea correcto.";
  }

  if (lower.includes("ollama embed failed")) {
    return "Error al generar embeddings con Ollama. Comprueba que el modelo nomic-embed-text esté instalado.";
  }

  if (lower.includes("ollama chat failed")) {
    return "Error al generar la respuesta con Ollama. Comprueba que el modelo llama3.2 esté instalado.";
  }

  if (lower.includes("timeout") || lower.includes("aborted")) {
    return "La consulta tardó demasiado. Intenta de nuevo o reduce la complejidad de la pregunta.";
  }

  return "Ocurrió un error al procesar la consulta. Intenta de nuevo en unos segundos.";
}
