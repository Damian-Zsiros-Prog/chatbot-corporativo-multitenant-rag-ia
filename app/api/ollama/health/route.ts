import { NextResponse } from "next/server";
import { checkOllamaHealth } from "@/lib/ollama/client";

export async function GET() {
  const health = await checkOllamaHealth();
  return NextResponse.json({
    ok: health.ok,
    baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    models: health.models,
  });
}
