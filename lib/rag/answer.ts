import type { SessionPayload } from "@/lib/auth/session";
import type { Citation } from "@/lib/db/schema";
import { checkScope, detectConversational } from "@/lib/rag/guardrails";
import {
  isNoDocumentInfoAnswer,
  noAccessibleInfoMessage,
  noDocumentInfoMessage,
} from "@/lib/rag/messages";
import { collectStreamedAnswer } from "@/lib/rag/stream-answer";
import type { AnswerMetadata, AnswerResult } from "@/lib/rag/types";
import {
  buildContextBlock,
  getMinScoreThreshold,
  retrieveChunks,
  type RetrievedChunk,
} from "@/lib/rag/retriever";

export type { AnswerMetadata, AnswerResult } from "@/lib/rag/types";

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

function toCitations(items: RetrievedChunk[]): Citation[] {
  return items.map((item) => ({
    chunkId: item.id,
    documentTitle: item.documentTitle,
    sectionRef: item.sectionRef,
    score: Number(item.score.toFixed(3)),
    excerpt: item.content.slice(0, 280),
  }));
}

export async function answerQuestion(
  question: string,
  session: SessionPayload,
): Promise<AnswerResult> {
  const started = Date.now();
  const scope = checkScope(question, session.tenantName);

  if (!scope.allowed) {
    return {
      type: "out_of_scope",
      answer: scope.message,
      citations: [],
      latencyMs: Date.now() - started,
      model: getModelName(),
      bestScore: 0,
      trace: { chunkIds: [], scores: [], threshold: getMinScoreThreshold() },
    };
  }

  const conversational = detectConversational(question, session.tenantName);
  if (conversational) {
    return {
      type: "conversational",
      answer: conversational,
      citations: [],
      latencyMs: Date.now() - started,
      model: getModelName(),
      bestScore: 0,
      trace: { chunkIds: [], scores: [], threshold: getMinScoreThreshold() },
    };
  }

  const { chunks: retrieved, bestScore } = await retrieveChunks(
    question,
    session,
  );
  const metadata = buildMetadata(retrieved, bestScore);

  if (retrieved.length === 0 || bestScore < getMinScoreThreshold()) {
    return {
      type: "no_information",
      answer: noAccessibleInfoMessage(session.tenantName),
      citations: [],
      latencyMs: Date.now() - started,
      ...metadata,
    };
  }

  const context = buildContextBlock(retrieved);
  const answer = await collectStreamedAnswer(
    session.tenantName,
    question,
    context,
  );

  const citations = toCitations(retrieved);

  if (isNoDocumentInfoAnswer(answer)) {
    return {
      type: "no_information",
      answer: noDocumentInfoMessage(session.tenantName),
      citations: [],
      latencyMs: Date.now() - started,
      ...metadata,
    };
  }

  return {
    type: "answer",
    answer,
    citations,
    retrieved,
    latencyMs: Date.now() - started,
    ...metadata,
  };
}
