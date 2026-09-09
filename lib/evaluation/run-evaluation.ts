import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { and, eq } from "drizzle-orm";
import type { SessionPayload } from "@/lib/auth/session";
import type { Citation } from "@/lib/db/schema";
import { closeDb, getDb } from "@/lib/db";
import { tenants, users } from "@/lib/db/schema";
import type { AnswerResult } from "@/lib/rag/answer";
import { answerQuestion } from "@/lib/rag/answer";

export type ExpectedBehavior =
  | "answer_with_citation"
  | "no_information"
  | "out_of_scope";

export type EvalQuestion = {
  id: string;
  tenant: string;
  category: string;
  role: SessionPayload["role"];
  question: string;
  expected_behavior: ExpectedBehavior;
  expected_doc?: string;
  expected_keywords?: string[];
  notes?: string;
};

export type EvalResult = {
  id: string;
  tenant: string;
  category: string;
  role: string;
  question: string;
  expected_behavior: ExpectedBehavior;
  actual_type: AnswerResult["type"];
  passed: boolean;
  answer: string;
  citations_count: number;
  latency_ms: number;
  failure_reason?: string;
};

const DOC_TITLE_MAP: Record<string, string[]> = {
  "reglamento-interno.md": ["Reglamento Interno"],
  "politica-sst.md": ["Seguridad y Salud", "SST"],
  "manual-bodega.md": ["Manual de Operaciones", "Bodega"],
  "politica-talento-humano.md": ["Talento Humano"],
  "codigo-conducta.md": ["Código de Conducta", "Conducta"],
  "normas-vestimenta.md": ["Vestimenta"],
  "procedimiento-check-in.md": ["Check-in"],
  "politica-huespedes-rh.md": ["Atención al Huésped", "Huésped"],
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function matchesDocument(citations: Citation[], expectedDoc: string): boolean {
  const hints = DOC_TITLE_MAP[expectedDoc] ?? [
    expectedDoc.replace(".md", "").replace(/-/g, " "),
  ];
  return citations.some((citation) =>
    hints.some((hint) =>
      normalize(citation.documentTitle).includes(normalize(hint)),
    ),
  );
}

function matchesKeywords(answer: string, keywords?: string[]): boolean {
  if (!keywords?.length) return true;
  const normalizedAnswer = normalize(answer);
  return keywords.some((keyword) =>
    normalizedAnswer.includes(normalize(keyword)),
  );
}

export function scoreAnswer(
  expected: ExpectedBehavior,
  result: AnswerResult,
  expectedDoc?: string,
  expectedKeywords?: string[],
): { passed: boolean; reason?: string } {
  switch (expected) {
    case "out_of_scope":
      if (result.type === "out_of_scope") return { passed: true };
      return {
        passed: false,
        reason: `Se esperaba out_of_scope, se obtuvo ${result.type}`,
      };

    case "no_information":
      if (result.type === "no_information") return { passed: true };
      if (
        result.type === "answer" &&
        normalize(result.answer).includes("no encontre informacion")
      ) {
        return { passed: true };
      }
      return {
        passed: false,
        reason: `Se esperaba no_information, se obtuvo ${result.type}`,
      };

    case "answer_with_citation":
      if (result.type !== "answer") {
        return {
          passed: false,
          reason: `Se esperaba answer, se obtuvo ${result.type}`,
        };
      }
      if (result.citations.length === 0) {
        return { passed: false, reason: "Sin citas documentales" };
      }
      if (expectedDoc && !matchesDocument(result.citations, expectedDoc)) {
        return {
          passed: false,
          reason: `Cita no coincide con documento esperado (${expectedDoc})`,
        };
      }
      if (!matchesKeywords(result.answer, expectedKeywords)) {
        return {
          passed: false,
          reason: "La respuesta no contiene palabras clave esperadas",
        };
      }
      return { passed: true };
  }
}

async function resolveSession(
  tenantSlug: string,
  role: SessionPayload["role"],
): Promise<SessionPayload> {
  const db = getDb();

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);

  if (!tenant) {
    throw new Error(`Tenant no encontrado: ${tenantSlug}`);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.tenantId, tenant.id), eq(users.role, role)))
    .limit(1);

  if (!user) {
    throw new Error(`Usuario no encontrado para ${tenantSlug} / ${role}`);
  }

  return {
    userId: user.id,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    tenantName: tenant.name,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export function loadQuestions(filePath?: string): EvalQuestion[] {
  const path =
    filePath ??
    resolve(process.cwd(), "docs/test-questions/questions.json");
  const raw = JSON.parse(readFileSync(path, "utf-8")) as {
    questions: EvalQuestion[];
  };
  return raw.questions;
}

export async function runEvaluation(
  questions: EvalQuestion[],
  onProgress?: (current: number, total: number, item: EvalQuestion) => void,
): Promise<EvalResult[]> {
  const results: EvalResult[] = [];

  for (let i = 0; i < questions.length; i++) {
    const item = questions[i];
    onProgress?.(i + 1, questions.length, item);

    const session = await resolveSession(item.tenant, item.role);
    const answer = await answerQuestion(item.question, session);
    const scored = scoreAnswer(
      item.expected_behavior,
      answer,
      item.expected_doc,
      item.expected_keywords,
    );

    results.push({
      id: item.id,
      tenant: item.tenant,
      category: item.category,
      role: item.role,
      question: item.question,
      expected_behavior: item.expected_behavior,
      actual_type: answer.type,
      passed: scored.passed,
      answer: answer.answer,
      citations_count: answer.citations.length,
      latency_ms: answer.latencyMs,
      failure_reason: scored.reason,
    });
  }

  return results;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

export function summarizeResults(results: EvalResult[]) {
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  const latencies = results.map((r) => r.latency_ms);
  const avgLatency = Math.round(
    latencies.reduce((sum, value) => sum + value, 0) / total,
  );
  const p95Latency = Math.round(percentile(latencies, 95));

  const byCategory = new Map<string, { passed: number; total: number }>();
  for (const result of results) {
    const current = byCategory.get(result.category) ?? {
      passed: 0,
      total: 0,
    };
    current.total += 1;
    if (result.passed) current.passed += 1;
    byCategory.set(result.category, current);
  }

  return {
    total,
    passed,
    failed,
    pass_rate: Number(((passed / total) * 100).toFixed(1)),
    avg_latency_ms: avgLatency,
    p95_latency_ms: p95Latency,
    by_category: Object.fromEntries(
      [...byCategory.entries()].map(([category, stats]) => [
        category,
        {
          ...stats,
          pass_rate: Number(((stats.passed / stats.total) * 100).toFixed(1)),
        },
      ]),
    ),
  };
}

export function renderMarkdownReport(
  summary: ReturnType<typeof summarizeResults>,
  results: EvalResult[],
): string {
  const lines = [
    "# Informe de evaluación RAG",
    "",
    `Fecha: ${new Date().toISOString()}`,
    "",
    "## Resumen",
    "",
    `| Métrica | Valor |`,
    `|---------|-------|`,
    `| Total preguntas | ${summary.total} |`,
    `| Correctas | ${summary.passed} |`,
    `| Incorrectas | ${summary.failed} |`,
    `| **Tasa de acierto** | **${summary.pass_rate}%** |`,
    `| Latencia promedio | ${summary.avg_latency_ms} ms |`,
    `| Latencia p95 | ${"p95_latency_ms" in summary ? summary.p95_latency_ms : "—"} ms |`,
    "",
    "## Resultados por categoría",
    "",
    "| Categoría | Aciertos | Total | % |",
    "|-----------|----------|-------|---|",
  ];

  for (const [category, stats] of Object.entries(summary.by_category)) {
    const s = stats as { passed: number; total: number; pass_rate: number };
    lines.push(
      `| ${category} | ${s.passed} | ${s.total} | ${s.pass_rate}% |`,
    );
  }

  lines.push("", "## Detalle de fallos", "");

  const failures = results.filter((r) => !r.passed);
  if (failures.length === 0) {
    lines.push("_Todas las preguntas pasaron la evaluación automática._");
  } else {
    for (const fail of failures) {
      lines.push(`### ${fail.id} — ${fail.question}`);
      lines.push(`- Esperado: \`${fail.expected_behavior}\``);
      lines.push(`- Obtenido: \`${fail.actual_type}\``);
      lines.push(`- Motivo: ${fail.failure_reason ?? "N/A"}`);
      lines.push(`- Respuesta: ${fail.answer.slice(0, 300)}...`);
      lines.push("");
    }
  }

  return lines.join("\n");
}

export function writeReports(
  results: EvalResult[],
  summary: ReturnType<typeof summarizeResults>,
  outputDir?: string,
): { jsonPath: string; mdPath: string } {
  const dir = outputDir ?? resolve(process.cwd(), "docs/results");
  mkdirSync(dir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = join(dir, `evaluation-${stamp}.json`);
  const mdPath = join(dir, `evaluation-${stamp}.md`);

  writeFileSync(
    jsonPath,
    JSON.stringify({ summary, results }, null, 2),
    "utf-8",
  );
  writeFileSync(mdPath, renderMarkdownReport(summary, results), "utf-8");

  return { jsonPath, mdPath };
}
