import type { Citation } from "@/lib/db/schema";

export type StreamDonePayload = {
  conversationId: string;
  type: "answer" | "conversational" | "no_information" | "out_of_scope";
  answer: string;
  citations: Citation[];
  latencyMs: number;
};

export async function consumeChatStream(
  response: Response,
  handlers: {
    onMeta: (data: { conversationId: string }) => void;
    onToken: (content: string) => void;
    onDone: (data: StreamDonePayload) => void;
    onError: (message: string) => void;
  },
  signal?: AbortSignal,
) {
  if (!response.body) {
    throw new Error("Respuesta vacía del servidor");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (signal?.aborted) {
        await reader.cancel();
        throw new DOMException("Consulta cancelada", "AbortError");
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const block of events) {
        if (!block.trim()) continue;

        let eventName = "message";
        let dataLine = "";

        for (const line of block.split("\n")) {
          if (line.startsWith("event: ")) eventName = line.slice(7).trim();
          if (line.startsWith("data: ")) dataLine = line.slice(6);
        }

        if (!dataLine) continue;

        const payload = JSON.parse(dataLine) as Record<string, unknown>;

        if (eventName === "meta") {
          handlers.onMeta(payload as { conversationId: string });
        } else if (eventName === "token") {
          handlers.onToken(String((payload as { content: string }).content));
        } else if (eventName === "done") {
          handlers.onDone(payload as StreamDonePayload);
        } else if (eventName === "cancelled") {
          throw new DOMException("Consulta cancelada", "AbortError");
        } else if (eventName === "error") {
          handlers.onError(String((payload as { error: string }).error));
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
