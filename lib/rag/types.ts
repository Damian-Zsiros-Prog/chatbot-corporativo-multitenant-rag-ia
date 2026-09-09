import type { Citation } from "@/lib/db/schema";
import type { RetrievedChunk } from "@/lib/rag/retriever";

export type AnswerMetadata = {
  model: string;
  bestScore: number;
  trace: {
    chunkIds: string[];
    scores: number[];
    threshold: number;
  };
};

export type AnswerResult =
  | ({
      type: "out_of_scope";
      answer: string;
      citations: Citation[];
      latencyMs: number;
    } & AnswerMetadata)
  | ({
      type: "conversational";
      answer: string;
      citations: Citation[];
      latencyMs: number;
    } & AnswerMetadata)
  | ({
      type: "no_information";
      answer: string;
      citations: Citation[];
      latencyMs: number;
    } & AnswerMetadata)
  | ({
      type: "answer";
      answer: string;
      citations: Citation[];
      retrieved: RetrievedChunk[];
      latencyMs: number;
    } & AnswerMetadata);

export type AnswerStreamChunk =
  | { kind: "token"; content: string }
  | { kind: "result"; result: AnswerResult };
