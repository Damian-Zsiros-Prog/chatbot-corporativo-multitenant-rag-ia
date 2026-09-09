import { closeDb } from "../lib/db";
import { ingestAllDocuments, ingestDocument } from "../lib/ingestion/ingest-document";

async function main() {
  const args = process.argv.slice(2);
  const documentId = args.find((arg) => !arg.startsWith("--"));
  const forceAll = args.includes("--all") || args.includes("--force");

  console.log("Iniciando ingestion RAG...\n");

  if (documentId) {
    const count = await ingestDocument(documentId);
    console.log(`\nListo: ${count} chunks indexados.`);
  } else {
    await ingestAllDocuments({ force: forceAll });
    console.log("\nIngestion completada.");
  }
}

main()
  .catch((error) => {
    console.error("Error en ingestion:", error);
    process.exit(1);
  })
  .finally(async () => {
    await closeDb();
  });
