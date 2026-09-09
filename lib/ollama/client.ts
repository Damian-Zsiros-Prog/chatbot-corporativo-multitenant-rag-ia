const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

export function getOllamaBaseUrl(): string {
  return OLLAMA_BASE_URL.replace(/\/$/, "");
}

export async function checkOllamaHealth(): Promise<{
  ok: boolean;
  models: string[];
}> {
  try {
    const response = await fetch(`${getOllamaBaseUrl()}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { ok: false, models: [] };
    }

    const data = (await response.json()) as {
      models?: Array<{ name: string }>;
    };

    return {
      ok: true,
      models: data.models?.map((model) => model.name) ?? [],
    };
  } catch {
    return { ok: false, models: [] };
  }
}

export async function listOllamaModels(): Promise<string[]> {
  const health = await checkOllamaHealth();
  return health.models;
}
