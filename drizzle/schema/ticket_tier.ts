import { pgTable as table } from "drizzle-orm/pg-core";
import { auditFields } from "../mixin/audit";
import { eventsTable } from "./event";
import { index } from "drizzle-orm/pg-core";

export const ticketTiersTable = table(
  "ticket_tiers",
  (t) => ({
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    uid: t.varchar({ length: 255 }).notNull(),
    eventId: t
      .integer("event_id")
      .references(() => eventsTable.id)
      .notNull(),
    tierName: t.varchar("tier_name", { length: 50 }).notNull(),
    price: t.numeric({ precision: 12, scale: 2 }).notNull().default("0.00"),
    totalCapacity: t.integer("total_capacity").notNull(),
    availableStock: t.integer("available_stock").notNull(),
    isActive: t.boolean("is_active").default(true),
    ...auditFields(t),
  }),
  (t) => [index("ticket_tiers_event_id_idx").on(t.eventId)],
);
