import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./drizzle/schema",
  out: "./drizzle",
  verbose: true,
  strict: true,
});
