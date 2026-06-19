import { pgTable as table } from "drizzle-orm/pg-core";
import { auditFields } from "../mixin/audit";

export const rolesTable = table("roles", (t) => ({
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  uid: t.varchar({ length: 255 }).notNull(),
  name: t.varchar({ length: 100 }).notNull(),
  code: t.char({ length: 3 }).notNull(),
  description: t.text(),
  isActive: t.boolean("is_active").default(true),
  ...auditFields(t),
}));
