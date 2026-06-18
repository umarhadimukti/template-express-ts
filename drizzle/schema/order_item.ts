import { pgTable as table, index } from "drizzle-orm/pg-core";
import { auditFields } from "../mixin/audit";
import { ordersTable } from "./order";
import { ticketTiersTable } from "./ticket_tier";

export const orderItemsTable = table(
  "order_items",
  (t) => ({
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    uid: t.varchar({ length: 255 }).notNull(),
    orderId: t
      .integer("order_id")
      .references(() => ordersTable.id)
      .notNull(),
    ticketTierId: t
      .integer("ticket_tier_id")
      .references(() => ticketTiersTable.id)
      .notNull(),
    qty: t.integer().notNull().default(1),
    ...auditFields(t),
  }),
  (t) => [
    index("order_items_order_id_idx").on(t.orderId),
    index("order_items_ticket_tier_id_idx").on(t.ticketTierId),
  ],
);
