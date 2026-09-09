import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin/require-super-admin";

type RouteContext = { params: Promise<{ name: string }> };

export async function GET(request: Request, context: RouteContext) {
  const session = await requireSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const { name } = await context.params;
  if (!/^evaluation-[\dTZ-]+\.(json|md)$/.test(name)) {
    return NextResponse.json({ error: "Archivo inválido" }, { status: 400 });
  }

  const filePath = join(process.cwd(), "docs", "results", name);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 });
  }

  const content = readFileSync(filePath, "utf-8");
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? (name.endsWith(".md") ? "md" : "json");

  if (format === "json") {
    return NextResponse.json(JSON.parse(content));
  }

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
    },
  });
}
