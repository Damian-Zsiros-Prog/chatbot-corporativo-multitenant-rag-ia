import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const USER_ROLES = [
  "empleado",
  "supervisor",
  "rh",
  "admin_empresa",
  "super_admin",
] as const;

export const DOCUMENT_STATUSES = [
  "queued",
  "indexing",
  "vectorized",
  "error",
] as const;

export const DOCUMENT_CATEGORIES = [
  "reglamento",
  "politica",
  "procedimiento",
  "manual",
  "codigo_conducta",
  "norma",
  "talento_humano",
  "seguridad",
  "otro",
] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

function uuidPrimaryKey(name: string) {
  return text(name)
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
}

function createdAtColumn() {
  return integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`);
}

function updatedAtColumn() {
  return integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`);
}

export const tenants = sqliteTable("tenants", {
  id: uuidPrimaryKey("id"),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  sector: text("sector").notNull(),
  description: text("description"),
  createdAt: createdAtColumn(),
});

export const users = sqliteTable(
  "users",
  {
    id: uuidPrimaryKey("id"),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").$type<UserRole>().notNull().default("empleado"),
    createdAt: createdAtColumn(),
  },
  (table) => [index("users_tenant_email_idx").on(table.tenantId, table.email)],
);

export const documents = sqliteTable(
  "documents",
  {
    id: uuidPrimaryKey("id"),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    category: text("category")
      .$type<DocumentCategory>()
      .notNull()
      .default("otro"),
    fileName: text("file_name").notNull(),
    filePath: text("file_path").notNull(),
    mimeType: text("mime_type").notNull().default("text/markdown"),
    sectionRef: text("section_ref"),
    description: text("description"),
    allowedRoles: text("allowed_roles", { mode: "json" })
      .$type<string[]>()
      .notNull(),
    status: text("status")
      .$type<DocumentStatus>()
      .notNull()
      .default("queued"),
    chunkCount: integer("chunk_count").notNull().default(0),
    errorMessage: text("error_message"),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [index("documents_tenant_idx").on(table.tenantId)],
);

export const chunks = sqliteTable(
  "chunks",
  {
    id: uuidPrimaryKey("id"),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    sectionRef: text("section_ref"),
    chunkIndex: integer("chunk_index").notNull(),
    tokenCount: integer("token_count"),
    embedding: text("embedding", { mode: "json" }).$type<number[]>(),
    allowedRoles: text("allowed_roles", { mode: "json" })
      .$type<string[]>()
      .notNull(),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index("chunks_tenant_document_idx").on(table.tenantId, table.documentId),
  ],
);

export const conversations = sqliteTable("conversations", {
  id: uuidPrimaryKey("id"),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("Nueva consulta"),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
});

export type Citation = {
  chunkId: string;
  documentTitle: string;
  sectionRef: string | null;
  score: number | null;
  excerpt: string;
};

export type ResponseType =
  | "answer"
  | "conversational"
  | "no_information"
  | "out_of_scope";

export type QueryTrace = {
  chunkIds: string[];
  scores: number[];
  threshold: number;
};

export const messages = sqliteTable("messages", {
  id: uuidPrimaryKey("id"),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  citations: text("citations", { mode: "json" }).$type<Citation[]>(),
  responseType: text("response_type").$type<ResponseType>(),
  model: text("model"),
  bestScore: integer("best_score"),
  trace: text("trace", { mode: "json" }).$type<QueryTrace>(),
  latencyMs: integer("latency_ms"),
  createdAt: createdAtColumn(),
});

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  documents: many(documents),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  conversations: many(conversations),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [documents.tenantId],
    references: [tenants.id],
  }),
  chunks: many(chunks),
}));

export type Tenant = typeof tenants.$inferSelect;
export type User = typeof users.$inferSelect;
export type Document = typeof documents.$inferSelect;
