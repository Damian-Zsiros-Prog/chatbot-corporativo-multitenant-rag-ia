import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin/require-super-admin";

export async function GET() {
  const session = await requireSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const resultsDir = join(process.cwd(), "docs", "results");
  let files: string[];

  try {
    files = readdirSync(resultsDir).filter(
      (file) => file.startsWith("evaluation-") && file.endsWith(".json"),
    );
  } catch {
    return NextResponse.json({ reports: [] });
  }

  const reports = files
    .map((fileName) => {
      const filePath = join(resultsDir, fileName);
      const mtime = statSync(filePath).mtimeMs;
      let summary = null;

      try {
        const parsed = JSON.parse(readFileSync(filePath, "utf-8")) as {
          summary?: Record<string, unknown>;
        };
        summary = parsed.summary ?? null;
      } catch {
        summary = null;
      }

      return { fileName, mtime, summary };
    })
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, 10);

  return NextResponse.json({ reports });
}
