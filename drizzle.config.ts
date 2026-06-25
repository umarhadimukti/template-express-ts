import { defineConfig } from "drizzle-kit";
import { cfg } from './src/config/config';

export default defineConfig({
  dialect: "postgresql",
  schema: "./drizzle/schema",
  out: "./drizzle",
  dbCredentials: {
    host: cfg.DB_HOST,
    port: cfg.DB_PORT,
    user: cfg.DB_USER,
    password: cfg.DB_PASSWORD,
    database: cfg.DB_NAME,
    ssl: cfg.DB_SSL === "disable" ? false : true,
  },
  verbose: true,
  strict: true,
});
