import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPostLoginRedirect } from "@/lib/auth/post-login-redirect";
import { verifyPassword } from "@/lib/auth/password";
import {
  createSessionToken,
  SESSION_COOKIE,
} from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { tenants, users } from "@/lib/db/schema";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  mode: z.enum(["tenant", "platform"]).default("tenant"),
  tenantSlug: z.string().min(1).optional(),
  nextPath: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const db = getDb();

    if (body.mode === "platform") {
      const [user] = await db
        .select()
        .from(users)
        .where(
          and(eq(users.email, body.email), eq(users.role, "super_admin")),
        )
        .limit(1);

      if (!user) {
        return NextResponse.json(
          { error: "Super administrador no encontrado" },
          { status: 401 },
        );
      }

      const valid = await verifyPassword(body.password, user.passwordHash);
      if (!valid) {
        return NextResponse.json(
          { error: "Credenciales inválidas" },
          { status: 401 },
        );
      }

      const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, user.tenantId))
        .limit(1);

      if (!tenant) {
        return NextResponse.json(
          { error: "Empresa del super admin no encontrada" },
          { status: 500 },
        );
      }

      const token = await createSessionToken({
        userId: user.id,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        tenantName: tenant.name,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      const redirectTo = getPostLoginRedirect(user.role, body.nextPath);

      const response = NextResponse.json({
        ok: true,
        redirectTo,
        user: {
          name: user.name,
          email: user.email,
          role: user.role,
          tenant: tenant.name,
        },
      });

      response.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    if (!body.tenantSlug) {
      return NextResponse.json(
        { error: "Empresa requerida" },
        { status: 400 },
      );
    }

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, body.tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 },
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(
        and(eq(users.email, body.email), eq(users.tenantId, tenant.id)),
      )
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 },
      );
    }

    if (user.role === "super_admin") {
      return NextResponse.json(
        {
          error:
            "El super administrador debe ingresar por la pestaña Super administrador",
        },
        { status: 403 },
      );
    }

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 },
      );
    }

    const token = await createSessionToken({
      userId: user.id,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantName: tenant.name,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const redirectTo = getPostLoginRedirect(user.role, body.nextPath);

    const response = NextResponse.json({
      ok: true,
      redirectTo,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        tenant: tenant.name,
      },
    });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos de entrada inválidos" },
        { status: 400 },
      );
    }
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
