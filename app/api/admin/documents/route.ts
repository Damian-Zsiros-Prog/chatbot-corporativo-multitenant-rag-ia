import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDb } from "@/lib/db";
import { DOCUMENT_CATEGORIES, tenants, USER_ROLES } from "@/lib/db/schema";
import {
  createDocument,
  listTenantDocuments,
} from "@/lib/documents/manage-document";
import { saveTenantDocument } from "@/lib/documents/storage";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const docs = await listTenantDocuments(session);
  return NextResponse.json({ documents: docs });
}

const uploadSchema = z.object({
  title: z.string().min(3).max(200),
  category: z.enum(DOCUMENT_CATEGORIES),
  sectionRef: z.string().max(80).optional(),
  description: z.string().max(500).optional(),
  allowedRoles: z.array(z.enum(USER_ROLES)).min(1),
  content: z.string().min(20).max(200_000),
  fileName: z.string().min(3).max(200),
});

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");

      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
      }

      if (!file.name.endsWith(".md")) {
        return NextResponse.json(
          { error: "Por ahora solo se admite Markdown (.md)" },
          { status: 400 },
        );
      }

      const allowedRolesRaw = String(form.get("allowedRoles") ?? "empleado,supervisor,rh,admin_empresa");
      const allowedRoles = allowedRolesRaw
        .split(",")
        .map((role) => role.trim())
        .filter(Boolean);

      const parsed = uploadSchema.parse({
        title: String(form.get("title") ?? file.name.replace(/\.md$/i, "")),
        category: String(form.get("category") ?? "otro"),
        sectionRef: form.get("sectionRef")?.toString() || undefined,
        description: form.get("description")?.toString() || undefined,
        allowedRoles,
        content: await file.text(),
        fileName: file.name,
      });

      let tenantId = session.tenantId;
      let tenantSlug = session.tenantSlug;

      if (session.role === "super_admin" && form.get("tenantSlug")) {
        const slug = String(form.get("tenantSlug"));
        const db = getDb();
        const [tenant] = await db
          .select()
          .from(tenants)
          .where(eq(tenants.slug, slug))
          .limit(1);
        if (!tenant) {
          return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
        }
        tenantId = tenant.id;
        tenantSlug = tenant.slug;
      }

      const filePath = saveTenantDocument(
        tenantSlug,
        `${Date.now()}-${parsed.fileName}`,
        parsed.content,
      );

      const result = await createDocument({
        session,
        tenantId,
        tenantSlug,
        title: parsed.title,
        category: parsed.category,
        sectionRef: parsed.sectionRef,
        description: parsed.description,
        allowedRoles: parsed.allowedRoles.filter(
          (role) => role !== "super_admin",
        ),
        fileName: parsed.fileName,
        filePath,
      });

      return NextResponse.json(result, { status: 201 });
    }

    const body = uploadSchema.parse(await request.json());
    const filePath = saveTenantDocument(
      session.tenantSlug,
      `${Date.now()}-${body.fileName}`,
      body.content,
    );

    const result = await createDocument({
      session,
      tenantId: session.tenantId,
      tenantSlug: session.tenantSlug,
      title: body.title,
      category: body.category,
      sectionRef: body.sectionRef,
      description: body.description,
      allowedRoles: body.allowedRoles.filter((role) => role !== "super_admin"),
      fileName: body.fileName,
      filePath,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al cargar documento" },
      { status: 500 },
    );
  }
}
