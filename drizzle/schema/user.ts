import { pgTable as table } from "drizzle-orm/pg-core";
import { auditFields } from "../mixin/audit";

export const usersTable = table("users", (t) => ({
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  uid: t.varchar({ length: 255 }).notNull(),
  name: t.varchar({ length: 100 }).notNull(),
  username: t.varchar({ length: 100 }).unique().notNull(),
  email: t.varchar({ length: 100 }).unique().notNull(),
  passwordHash: t.varchar("password_hash", { length: 255 }).notNull(),
  isActive: t.boolean("is_active").default(true),
  ...auditFields(t),
}));
