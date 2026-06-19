import { pgTable as table } from "drizzle-orm/pg-core";
import { auditFields } from "../mixin/audit";
import { usersTable } from "./user";
import { rolesTable } from "./role";
import { index } from "drizzle-orm/pg-core";

export const userRoleTable = table(
  "user_role",
  (t) => ({
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    uid: t.varchar({ length: 255 }).notNull(),
    userId: t
      .integer("user_id")
      .references(() => usersTable.id)
      .notNull(),
    roleId: t
      .integer("role_id")
      .references(() => rolesTable.id)
      .notNull(),
    isActive: t.boolean("is_active").default(true),
    ...auditFields(t),
  }),
  (t) => [
    index("user_role_user_id_idx").on(t.userId),
    index("user_role_role_id_idx").on(t.roleId),
  ],
);
