import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { tenants } from "@/lib/db/schema";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .select({
        slug: tenants.slug,
        name: tenants.name,
        sector: tenants.sector,
      })
      .from(tenants);

    return NextResponse.json({ tenants: rows });
  } catch {
    return NextResponse.json({ tenants: [] });
  }
}
