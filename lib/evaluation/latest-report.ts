import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export type EvaluationSummary = {
  total: number;
  passed: number;
  failed: number;
  pass_rate: number;
  avg_latency_ms: number;
  by_category: Record<
    string,
    { passed: number; total: number; pass_rate: number }
  >;
};

export type LatestEvaluationReport = {
  fileName: string;
  generatedAt: string;
  summary: EvaluationSummary;
};

export function getLatestEvaluationReport(): LatestEvaluationReport | null {
  const resultsDir = join(process.cwd(), "docs", "results");
  let files: string[];

  try {
    files = readdirSync(resultsDir).filter(
      (file) => file.startsWith("evaluation-") && file.endsWith(".json"),
    );
  } catch {
    return null;
  }

  if (files.length === 0) return null;

  const sorted = files
    .map((file) => ({
      file,
      mtime: statSync(join(resultsDir, file)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  const latest = sorted[0].file;
  const raw = readFileSync(join(resultsDir, latest), "utf-8");
  const parsed = JSON.parse(raw) as { summary: EvaluationSummary };

  const timestampMatch = latest.match(
    /evaluation-(\d{4}-\d{2}-\d{2}T[\d-]+Z)\.json/,
  );

  return {
    fileName: latest,
    generatedAt: timestampMatch?.[1] ?? latest,
    summary: parsed.summary,
  };
}
