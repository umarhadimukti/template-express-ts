import { Config } from "#/config/config";
import { logger } from "#/pkg/logger/logger";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";

const { Pool } = pg;

export type Database = NodePgDatabase;

let db: Database;
let pool: pg.Pool | undefined;

export function initDatabase(cfg: Config) {
  if (db) return db;
  pool = new Pool({
    connectionString: cfg.DB_URL,
    max: 15,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on("error", (err: Error) => {
    logger.error(`Unexpected error on idle db client: ${err}`);
    process.exit(-1);
  });

  db = drizzle({ client: pool });
  return db;
}

export async function closeDatabase() {
  if (!pool) return;
  const closing = pool;
  pool = undefined;
  await closing.end();
  logger.info("DB pool closed.");
}

export { db };
