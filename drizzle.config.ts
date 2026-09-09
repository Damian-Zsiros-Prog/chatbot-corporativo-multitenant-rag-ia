import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { defineConfig } from "drizzle-kit";

const dbPath = resolve(
  process.cwd(),
  process.env.DATABASE_PATH ?? "./data/chatbot.db",
);
mkdirSync(dirname(dbPath), { recursive: true });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
});
