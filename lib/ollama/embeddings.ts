import { getOllamaBaseUrl } from "@/lib/ollama/client";

export async function embedText(text: string): Promise<number[]> {
  const model = process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text";
  const baseUrl = getOllamaBaseUrl();

  const embedResponse = await fetch(`${baseUrl}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, input: text }),
  });

  if (embedResponse.ok) {
    const data = (await embedResponse.json()) as {
      embeddings?: number[][];
      embedding?: number[];
    };
    if (data.embeddings?.[0]) return data.embeddings[0];
    if (data.embedding) return data.embedding;
  }

  const legacyResponse = await fetch(`${baseUrl}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt: text }),
  });

  if (!legacyResponse.ok) {
    const error = await legacyResponse.text();
    throw new Error(`Ollama embed failed: ${error}`);
  }

  const legacy = (await legacyResponse.json()) as { embedding: number[] };
  return legacy.embedding;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const model = process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text";
  const baseUrl = getOllamaBaseUrl();

  const batchResponse = await fetch(`${baseUrl}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, input: texts }),
  });

  if (batchResponse.ok) {
    const data = (await batchResponse.json()) as { embeddings: number[][] };
    return data.embeddings;
  }

  const results: number[][] = [];
  for (const text of texts) {
    results.push(await embedText(text));
  }
  return results;
}
