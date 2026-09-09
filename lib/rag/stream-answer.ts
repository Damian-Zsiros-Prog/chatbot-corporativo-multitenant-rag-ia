import type { SessionPayload } from "@/lib/auth/session";
import type { Citation } from "@/lib/db/schema";
import { getOllamaBaseUrl } from "@/lib/ollama/client";
import { checkScope, detectConversational } from "@/lib/rag/guardrails";
import {
  isNoDocumentInfoAnswer,
  noAccessibleInfoMessage,
  noDocumentInfoMessage,
} from "@/lib/rag/messages";
import {
  buildContextBlock,
  getMinScoreThreshold,
  retrieveChunks,
  type RetrievedChunk,
} from "@/lib/rag/retriever";
import type {
  AnswerMetadata,
  AnswerResult,
  AnswerStreamChunk,
} from "@/lib/rag/types";

export type { AnswerStreamChunk } from "@/lib/rag/types";

function getModelName(): string {
  return process.env.OLLAMA_MODEL ?? "llama3.2";
}

function buildMetadata(
  retrieved: RetrievedChunk[],
  bestScore: number,
): AnswerMetadata {
  return {
    model: getModelName(),
    bestScore: Number(bestScore.toFixed(4)),
    trace: {
      chunkIds: retrieved.map((item) => item.id),
      scores: retrieved.map((item) => Number(item.score.toFixed(4))),
      threshold: getMinScoreThreshold(),
    },
  };
}

function buildSystemPrompt(tenantName: string): string {
  return `Eres un asistente corporativo de ${tenantName}. Tu única función es responder preguntas sobre reglamentos, políticas y procedimientos internos usando EXCLUSIVAMENTE el CONTEXTO proporcionado.

Reglas estrictas:
1. Responde SOLO con información presente en el CONTEXTO.
2. Cita cada afirmación importante con el número entre corchetes del fragmento, por ejemplo [1] o [2].
3. Si la respuesta no está en el CONTEXTO, responde de forma breve y amable que no encontraste ese dato en la documentación disponible de ${tenantName} (sin inventar información).
4. No inventes políticas, plazos, cifras ni interpretaciones legales.
5. Responde en español, de forma clara y profesional.
6. No des consejos legales; indica que el usuario debe verificar en el documento oficial.
7. Si hay varios horarios o cifras, responde exactamente el dato que corresponde a la pregunta (no confundas horarios relacionados).`;
}

function toCitations(items: RetrievedChunk[]): Citation[] {
  return items.map((item) => ({
    chunkId: item.id,
    documentTitle: item.documentTitle,
    sectionRef: item.sectionRef,
    score: Number(item.score.toFixed(3)),
    excerpt: item.content.slice(0, 280),
  }));
}

function buildChatMessages(
  tenantName: string,
  question: string,
  context: string,
) {
  return [
    { role: "system", content: buildSystemPrompt(tenantName) },
    {
      role: "user",
      content: `CONTEXTO:\n${context}\n\nPREGUNTA:\n${question}`,
    },
  ];
}

async function* streamOllamaTokens(
  tenantName: string,
  question: string,
  context: string,
): AsyncGenerator<string> {
  const model = getModelName();

  const response = await fetch(`${getOllamaBaseUrl()}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: true,
      messages: buildChatMessages(tenantName, question, context),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama chat failed: ${error}`);
  }

  if (!response.body) {
    throw new Error("Ollama chat failed: empty response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const data = JSON.parse(trimmed) as {
        message?: { content?: string };
      };

      if (data.message?.content) {
        yield data.message.content;
      }
    }
  }
}

async function* streamFixedText(text: string): AsyncGenerator<string> {
  for (const part of text.split(/(\s+)/).filter(Boolean)) {
    yield part;
  }
}

export function streamAnswerQuestion(
  question: string,
  session: SessionPayload,
): AsyncGenerator<AnswerStreamChunk> {
  return runStreamAnswerQuestion(question, session);
}

async function* runStreamAnswerQuestion(
  question: string,
  session: SessionPayload,
): AsyncGenerator<AnswerStreamChunk> {
  const started = Date.now();
  const scope = checkScope(question, session.tenantName);

  if (!scope.allowed) {
    let answer = "";
    for await (const token of streamFixedText(scope.message)) {
      answer += token;
      yield { kind: "token", content: token };
    }

    yield {
      kind: "result",
      result: {
        type: "out_of_scope",
        answer,
        citations: [],
        latencyMs: Date.now() - started,
        model: getModelName(),
        bestScore: 0,
        trace: { chunkIds: [], scores: [], threshold: getMinScoreThreshold() },
      },
    };
    return;
  }

  const conversational = detectConversational(question, session.tenantName);
  if (conversational) {
    let answer = "";
    for await (const token of streamFixedText(conversational)) {
      answer += token;
      yield { kind: "token", content: token };
    }

    yield {
      kind: "result",
      result: {
        type: "conversational",
        answer,
        citations: [],
        latencyMs: Date.now() - started,
        model: getModelName(),
        bestScore: 0,
        trace: { chunkIds: [], scores: [], threshold: getMinScoreThreshold() },
      },
    };
    return;
  }

  const { chunks: retrieved, bestScore } = await retrieveChunks(
    question,
    session,
  );
  const metadata = buildMetadata(retrieved, bestScore);

  if (retrieved.length === 0 || bestScore < getMinScoreThreshold()) {
    const message = noAccessibleInfoMessage(session.tenantName);
    let answer = "";

    for await (const token of streamFixedText(message)) {
      answer += token;
      yield { kind: "token", content: token };
    }

    yield {
      kind: "result",
      result: {
        type: "no_information",
        answer,
        citations: [],
        latencyMs: Date.now() - started,
        ...metadata,
      },
    };
    return;
  }

  const context = buildContextBlock(retrieved);
  const citations = toCitations(retrieved);
  let answer = "";

  for await (const token of streamOllamaTokens(
    session.tenantName,
    question,
    context,
  )) {
    answer += token;
    yield { kind: "token", content: token };
  }

  answer = answer.trim();

  if (isNoDocumentInfoAnswer(answer)) {
    answer = noDocumentInfoMessage(session.tenantName);
    yield {
      kind: "result",
      result: {
        type: "no_information",
        answer,
        citations: [],
        latencyMs: Date.now() - started,
        ...metadata,
      },
    };
    return;
  }

  yield {
    kind: "result",
    result: {
      type: "answer",
      answer,
      citations,
      retrieved,
      latencyMs: Date.now() - started,
      ...metadata,
    },
  };
}

export async function collectStreamedAnswer(
  tenantName: string,
  question: string,
  context: string,
): Promise<string> {
  let answer = "";
  for await (const token of streamOllamaTokens(tenantName, question, context)) {
    answer += token;
  }
  return answer.trim();
}
