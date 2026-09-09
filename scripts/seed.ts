import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { and, eq } from "drizzle-orm";
import { closeDb, getDb } from "../lib/db";
import { documents, tenants, users } from "../lib/db/schema";
import { hashPassword } from "../lib/auth/password";
import { DEMO_PASSWORD } from "../lib/constants";

const ROOT = join(process.cwd(), "storage", "seed");

type SeedDocument = {
  fileName: string;
  title: string;
  sectionRef: string;
  category: string;
  allowedRoles: string[];
};

type SeedTenant = {
  slug: string;
  name: string;
  sector: string;
  description: string;
  documents: SeedDocument[];
  users: Array<{
    email: string;
    name: string;
    role: "empleado" | "supervisor" | "rh" | "admin_empresa";
  }>;
};

const TENANTS: SeedTenant[] = [
  {
    slug: "logistica-caribe",
    name: "Logística Caribe S.A.",
    sector: "Logística / Zona Franca",
    description:
      "Empresa simulada de operaciones logísticas en la Zona Franca de Cartagena.",
    documents: [
      {
        fileName: "reglamento-interno.md",
        title: "Reglamento Interno de Trabajo",
        sectionRef: "LC-REG-2025",
        category: "reglamento",
        allowedRoles: ["empleado", "supervisor", "rh", "admin_empresa"],
      },
      {
        fileName: "politica-sst.md",
        title: "Política de Seguridad y Salud en el Trabajo",
        sectionRef: "LC-SST-2024",
        category: "seguridad",
        allowedRoles: ["empleado", "supervisor", "rh", "admin_empresa"],
      },
      {
        fileName: "manual-bodega.md",
        title: "Manual de Operaciones de Bodega",
        sectionRef: "LC-BOD-2024",
        category: "manual",
        allowedRoles: ["empleado", "supervisor", "admin_empresa"],
      },
      {
        fileName: "politica-talento-humano.md",
        title: "Política de Talento Humano",
        sectionRef: "LC-RH-2024",
        category: "talento_humano",
        allowedRoles: ["rh", "admin_empresa"],
      },
    ],
    users: [
      {
        email: "empleado@logistica.demo",
        name: "Carlos Operario",
        role: "empleado",
      },
      {
        email: "supervisor@logistica.demo",
        name: "Ana Supervisor",
        role: "supervisor",
      },
      {
        email: "rh@logistica.demo",
        name: "María Talento Humano",
        role: "rh",
      },
      {
        email: "admin@logistica.demo",
        name: "Admin Logística",
        role: "admin_empresa",
      },
    ],
  },
  {
    slug: "hotel-bahia-dorada",
    name: "Hotel Bahía Dorada",
    sector: "Turismo / Hospitalidad",
    description:
      "Empresa simulada de hotelería en el sector turístico de Cartagena.",
    documents: [
      {
        fileName: "codigo-conducta.md",
        title: "Código de Conducta",
        sectionRef: "HB-CC-2025",
        category: "codigo_conducta",
        allowedRoles: ["empleado", "supervisor", "rh", "admin_empresa"],
      },
      {
        fileName: "normas-vestimenta.md",
        title: "Normas de Vestimenta",
        sectionRef: "HB-VEST-2024",
        category: "norma",
        allowedRoles: ["empleado", "supervisor", "rh", "admin_empresa"],
      },
      {
        fileName: "procedimiento-check-in.md",
        title: "Procedimiento de Check-in",
        sectionRef: "HB-CHK-2024",
        category: "procedimiento",
        allowedRoles: ["empleado", "supervisor", "admin_empresa"],
      },
      {
        fileName: "politica-huespedes-rh.md",
        title: "Política de Atención al Huésped (RH)",
        sectionRef: "HB-HSP-2024",
        category: "politica",
        allowedRoles: ["rh", "admin_empresa"],
      },
    ],
    users: [
      {
        email: "empleado@hotel.demo",
        name: "Laura Recepción",
        role: "empleado",
      },
      {
        email: "supervisor@hotel.demo",
        name: "Pedro Supervisor",
        role: "supervisor",
      },
      {
        email: "rh@hotel.demo",
        name: "Diana Talento Humano",
        role: "rh",
      },
      {
        email: "admin@hotel.demo",
        name: "Admin Hotel",
        role: "admin_empresa",
      },
    ],
  },
];

async function seed() {
  const db = getDb();
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  console.log("Sembrando datos demo...");

  for (const tenantData of TENANTS) {
    const [existingTenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantData.slug))
      .limit(1);

    let tenantId = existingTenant?.id;

    if (existingTenant) {
      console.log(`  Tenant existente: ${tenantData.name}`);
    } else {
      const [created] = await db
        .insert(tenants)
        .values({
          slug: tenantData.slug,
          name: tenantData.name,
          sector: tenantData.sector,
          description: tenantData.description,
        })
        .returning();
      tenantId = created.id;
      console.log(`  Tenant creado: ${tenantData.name}`);
    }

    if (!tenantId) continue;

    for (const userData of tenantData.users) {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);

      if (!existingUser) {
        await db.insert(users).values({
          tenantId,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          passwordHash,
        });
        console.log(`    Usuario: ${userData.email} (${userData.role})`);
      }
    }

    for (const doc of tenantData.documents) {
      const sourcePath = join(ROOT, tenantData.slug, doc.fileName);
      if (!existsSync(sourcePath)) {
        console.warn(`    Archivo no encontrado: ${sourcePath}`);
        continue;
      }

      readFileSync(sourcePath, "utf-8");
      const targetPath = join("storage", tenantData.slug, doc.fileName);

      const [existingDoc] = await db
        .select()
        .from(documents)
        .where(
          and(
            eq(documents.tenantId, tenantId),
            eq(documents.fileName, doc.fileName),
          ),
        )
        .limit(1);

      if (!existingDoc) {
        await db.insert(documents).values({
          tenantId,
          title: doc.title,
          category: doc.category as typeof documents.$inferInsert.category,
          fileName: doc.fileName,
          filePath: targetPath,
          mimeType: "text/markdown",
          sectionRef: doc.sectionRef,
          allowedRoles: doc.allowedRoles,
          status: "queued",
        });
        console.log(`    Documento: ${doc.title}`);
      } else if (existingDoc.category !== doc.category) {
        await db
          .update(documents)
          .set({
            category: doc.category as typeof documents.$inferInsert.category,
            updatedAt: new Date(),
          })
          .where(eq(documents.id, existingDoc.id));
        console.log(`    Categoría actualizada: ${doc.title} → ${doc.category}`);
      }
    }
  }

  const [superAdminExists] = await db
    .select()
    .from(users)
    .where(eq(users.email, "super@demo.local"))
    .limit(1);

  if (!superAdminExists) {
    const [firstTenant] = await db.select().from(tenants).limit(1);
    if (firstTenant) {
      await db.insert(users).values({
        tenantId: firstTenant.id,
        email: "super@demo.local",
        name: "Super Admin Demo",
        role: "super_admin",
        passwordHash,
      });
      console.log("  Super admin: super@demo.local");
    }
  }

  console.log("\nSeed completado.");
  console.log(`Contraseña demo para todos los usuarios: ${DEMO_PASSWORD}`);
}

seed()
  .catch((error) => {
    console.error("Error en seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await closeDb();
  });
