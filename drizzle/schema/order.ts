import { pgTable as table } from "drizzle-orm/pg-core";
import { auditFields } from "../mixin/audit";
import { index } from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const ordersTable = table(
  "orders",
  (t) => ({
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    uid: t.varchar({ length: 255 }).notNull(),
    userId: t
      .integer("user_id")
      .references(() => usersTable.id)
      .notNull(),
    totalAmount: t
      .numeric("total_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0.00"),
    status: t.varchar({ length: 20 }).notNull(),
    expiredAt: t.timestamp("expired_at", { withTimezone: true }),
    ...auditFields(t),
  }),
  (t) => [index("orders_user_id_idx").on(t.userId)],
);
