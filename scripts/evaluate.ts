import { closeDb } from "../lib/db";
import {
  loadQuestions,
  runEvaluation,
  summarizeResults,
  writeReports,
} from "../lib/evaluation/run-evaluation";

async function main() {
  const args = process.argv.slice(2);
  const outputFlag = args.indexOf("--export");
  const outputDir = outputFlag >= 0 ? args[outputFlag + 1] : undefined;

  console.log("Evaluación RAG — 40 preguntas\n");

  const limitFlag = args.indexOf("--limit");
  const limit =
    limitFlag >= 0 ? Number(args[limitFlag + 1]) : undefined;

  let questions = loadQuestions();
  if (limit && limit > 0) {
    questions = questions.slice(0, limit);
    console.log(`Modo muestra: ${limit} preguntas.\n`);
  }
  console.log(`Cargadas ${questions.length} preguntas.\n`);

  const results = await runEvaluation(questions, (current, total, item) => {
    process.stdout.write(
      `\r[${current}/${total}] ${item.id} — ${item.question.slice(0, 50)}...`,
    );
  });
  console.log("\n");
  const summary = summarizeResults(results);
  const paths = writeReports(results, summary, outputDir);

  console.log("=== RESUMEN ===");
  console.log(
    `Aciertos: ${summary.passed}/${summary.total} (${summary.pass_rate}%)`,
  );
  console.log(`Latencia promedio: ${summary.avg_latency_ms} ms`);
  if ("p95_latency_ms" in summary) {
    console.log(`Latencia p95: ${summary.p95_latency_ms} ms`);
  }
  console.log("\nPor categoría:");
  for (const [cat, stats] of Object.entries(summary.by_category)) {
    const s = stats as { passed: number; total: number; pass_rate: number };
    console.log(`  ${cat}: ${s.passed}/${s.total} (${s.pass_rate}%)`);
  }
  console.log(`\nReporte JSON: ${paths.jsonPath}`);
  console.log(`Reporte MD:   ${paths.mdPath}`);
}

main()
  .catch((error) => {
    console.error("Error en evaluación:", error);
    process.exit(1);
  })
  .finally(async () => {
    await closeDb();
  });
