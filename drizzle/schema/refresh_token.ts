import { pgTable as table } from "drizzle-orm/pg-core";
import { auditFields } from "../mixin/audit";
import { index } from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const refreshTokensTable = table(
  "refresh_tokens",
  (t) => ({
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    uid: t.varchar({ length: 255 }).notNull(),
    userId: t
      .integer("user_id")
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
    token: t.varchar({ length: 512 }).unique().notNull(),
    isUsed: t.boolean("is_used").default(false).notNull(),
    expiredAt: t.timestamp("expired_at", { withTimezone: true }),
    meta: t.jsonb(),
    ...auditFields(t),
  }),
  (t) => [index("refresh_tokens_user_id_idx").on(t.userId)],
);
