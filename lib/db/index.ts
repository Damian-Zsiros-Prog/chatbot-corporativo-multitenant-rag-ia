import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import * as schema from "./schema";

const SEED_DB_PATH = resolve(process.cwd(), "data", "chatbot.seed.db");

function ensureDatabaseFile(path: string): void {
  if (existsSync(path)) return;

  mkdirSync(dirname(path), { recursive: true });

  if (existsSync(SEED_DB_PATH)) {
    copyFileSync(SEED_DB_PATH, path);
    return;
  }
}

function tableColumns(db: Database.Database, table: string): Set<string> {
  const rows = db.pragma(`table_info(${table})`) as Array<{ name: string }>;
  return new Set(rows.map((row) => row.name));
}

function addColumnIfMissing(
  db: Database.Database,
  table: string,
  column: string,
  definition: string,
): void {
  if (tableColumns(db, table).has(column)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

function migrateSqlite(db: Database.Database): void {
  addColumnIfMissing(db, "messages", "edit_of_message_id", "text");
}

let sqlite: Database.Database | null = null;
let database: BetterSQLite3Database<typeof schema> | null = null;

export function getDbPath(): string {
  if (process.env.DATABASE_PATH) {
    return resolve(process.cwd(), process.env.DATABASE_PATH);
  }
  return resolve(process.cwd(), "data", "chatbot.db");
}

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (database) return database;

  const path = getDbPath();
  ensureDatabaseFile(path);

  sqlite = new Database(path);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  migrateSqlite(sqlite);

  database = drizzle(sqlite, { schema });
  return database;
}

export function closeDb(): void {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    database = null;
  }
}

export { schema };
