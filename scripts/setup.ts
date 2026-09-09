import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

function run(command: string, label: string) {
  console.log(`\n▶ ${label}`);
  execSync(command, { stdio: "inherit", cwd: process.cwd() });
}

async function checkOllama() {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      console.warn(`⚠ Ollama respondió ${response.status} en ${baseUrl}`);
      return;
    }
    const data = (await response.json()) as { models?: { name: string }[] };
    const names = data.models?.map((model) => model.name) ?? [];
    console.log(`✓ Ollama OK (${baseUrl}) — modelos: ${names.join(", ") || "ninguno"}`);
    if (!names.some((name) => name.startsWith("llama3.2"))) {
      console.warn("  Ejecuta: pnpm ollama:pull");
    }
  } catch {
    console.warn(`⚠ Ollama no disponible en ${baseUrl}. La ingestión puede fallar.`);
    console.warn("  Inicia Ollama o apunta OLLAMA_BASE_URL en .env.local");
  }
}

async function main() {
  console.log("=== Setup Chatbot RAG ===\n");

  const dataDir = join(process.cwd(), "data");
  if (!existsSync(dataDir)) {
    console.log("Creando carpeta data/...");
  }

  if (!existsSync(join(process.cwd(), ".env.local"))) {
    console.warn("⚠ No existe .env.local — copia .env.example a .env.local");
  }

  run("pnpm db:push", "Esquema SQLite (drizzle push)");
  run("pnpm db:seed", "Seed empresas, usuarios y documentos");
  await checkOllama();
  run("pnpm ingest --all", "Indexación RAG (chunks + embeddings)");

  console.log("\n=== Setup completado ===");
  console.log("Inicia la app: pnpm dev");
  console.log("Login demo: empleado@logistica.demo / demo123");
  console.log("Admin: admin@logistica.demo / demo123");
  console.log("URL: http://localhost:3000");
}

main().catch((error) => {
  console.error("Setup falló:", error);
  process.exit(1);
});
