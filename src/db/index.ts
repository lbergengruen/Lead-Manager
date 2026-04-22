import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { env } from "@/env";
import * as schema from "@/db/schema";

let _sql: ReturnType<typeof neon> | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

export function getSql() {
  if (_sql) return _sql;

  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  _sql = neon(env.databaseUrl);
  return _sql;
}

export function getDb() {
  if (_db) return _db;
  _db = drizzle({ client: getSql(), schema });
  return _db;
}

export { schema };
