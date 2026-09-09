import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { fetchQueryLogs, toCsv } from "@/lib/analytics/export-queries";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (session.role !== "super_admin" && session.role !== "admin_empresa") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "json";
  const limit = Number(searchParams.get("limit") ?? 500);

  const rows = await fetchQueryLogs(limit).then((items) =>
    session.role === "super_admin"
      ? items
      : items.filter((item) => item.tenantSlug === session.tenantSlug),
  );

  const normalized = rows.map((row) => ({
    ...row,
    bestScore:
      row.bestScore != null ? Number((row.bestScore / 10000).toFixed(4)) : null,
  }));

  if (format === "csv") {
    return new NextResponse(toCsv(normalized), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="query-logs-${Date.now()}.csv"`,
      },
    });
  }

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    count: normalized.length,
    rows: normalized,
  });
}
