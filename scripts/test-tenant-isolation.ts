import { closeDb } from "../lib/db";
import { answerQuestion } from "../lib/rag/answer";
import type { SessionPayload } from "../lib/auth/session";
import { and, eq } from "drizzle-orm";
import { getDb } from "../lib/db";
import { tenants, users } from "../lib/db/schema";

async function sessionFor(
  tenantSlug: string,
  role: SessionPayload["role"],
): Promise<SessionPayload> {
  const db = getDb();
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);
  if (!tenant) throw new Error(`Tenant ${tenantSlug} no encontrado`);

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.tenantId, tenant.id), eq(users.role, role)))
    .limit(1);
  if (!user) throw new Error(`Usuario ${tenantSlug}/${role} no encontrado`);

  return {
    userId: user.id,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    tenantName: tenant.name,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

type TestCase = {
  name: string;
  session: SessionPayload;
  question: string;
  expect: "has_answer" | "no_info" | "out_of_scope";
};

async function main() {
  console.log("=== Test aislamiento multi-tenant ===\n");

  const logisticaEmpleado = await sessionFor("logistica-caribe", "empleado");
  const logisticaRh = await sessionFor("logistica-caribe", "rh");
  const hotelEmpleado = await sessionFor("hotel-bahia-dorada", "empleado");

  const cases: TestCase[] = [
    {
      name: "RH Logística — desvinculación (debe responder)",
      session: logisticaRh,
      question: "¿Cuál es el procedimiento de desvinculación por justa causa?",
      expect: "has_answer",
    },
    {
      name: "Empleado Logística — desvinculación (RBAC bloqueado)",
      session: logisticaEmpleado,
      question: "¿Cuál es el procedimiento de desvinculación por justa causa?",
      expect: "no_info",
    },
    {
      name: "Hotel — horario Logística (cross-tenant sin datos)",
      session: hotelEmpleado,
      question: "¿A qué hora inicia el turno nocturno de bodega en Logística Caribe?",
      expect: "no_info",
    },
    {
      name: "Fuera de alcance — fútbol",
      session: logisticaEmpleado,
      question: "¿Quién ganó el último mundial de fútbol?",
      expect: "out_of_scope",
    },
  ];

  let passed = 0;

  for (const testCase of cases) {
    const result = await answerQuestion(testCase.question, testCase.session);
    let ok = false;

    if (testCase.expect === "has_answer") ok = result.type === "answer";
    if (testCase.expect === "no_info") ok = result.type === "no_information";
    if (testCase.expect === "out_of_scope") ok = result.type === "out_of_scope";

    console.log(`${ok ? "✓" : "✗"} ${testCase.name}`);
    console.log(`   → ${result.type}`);
    if (ok) passed += 1;
  }

  console.log(`\nResultado: ${passed}/${cases.length}`);
  if (passed !== cases.length) process.exit(1);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await closeDb();
  });
