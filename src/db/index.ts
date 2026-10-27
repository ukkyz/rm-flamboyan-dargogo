import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";
import { bootstrapSqlite } from "./bootstrap";

/**
 * Resolusi lokasi file SQLite.
 * Prioritas: SQLITE_DB_PATH, lalu DATABASE_URL berformat `file:...`, lalu default ./data/padang.sqlite
 */
function resolveDbPath(): string {
  const fromEnv =
    process.env.SQLITE_DB_PATH ||
    (process.env.DATABASE_URL?.startsWith("file:")
      ? process.env.DATABASE_URL.slice("file:".length)
      : "") ||
    "./data/padang.sqlite";

  if (fromEnv === ":memory:") return ":memory:";
  return path.isAbsolute(fromEnv) ? fromEnv : path.join(process.cwd(), fromEnv);
}

const globalForDb = globalThis as typeof globalThis & {
  __padangSqlite?: Database.Database;
  __padangDb?: BetterSQLite3Database<typeof schema>;
};

function createConnection(): Database.Database {
  const file = resolveDbPath();
  if (file !== ":memory:") {
    fs.mkdirSync(path.dirname(file), { recursive: true });
  }
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  bootstrapSqlite(sqlite);
  return sqlite;
}

export const sqlite: Database.Database = globalForDb.__padangSqlite ?? createConnection();

if (!globalForDb.__padangSqlite) {
  globalForDb.__padangSqlite = sqlite;
}

export const db: BetterSQLite3Database<typeof schema> = globalForDb.__padangDb ?? drizzle(sqlite, { schema });

if (!globalForDb.__padangDb) {
  globalForDb.__padangDb = db;
}

export { schema };
