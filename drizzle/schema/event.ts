import { pgTable as table } from "drizzle-orm/pg-core";
import { auditFields } from "../mixin/audit";

export const eventsTable = table("ms_events", (t) => ({
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  uid: t.varchar({ length: 255 }).notNull(),
  name: t.varchar({ length: 100 }).notNull(),
  description: t.text(),
  eventDate: t.timestamp("event_date", { withTimezone: true }).notNull(),
  city: t.varchar({ length: 100 }),
  eventType: t.varchar("event_type", { length: 30 }),
  isActive: t.boolean("is_active").default(true),
  ...auditFields(t),
}));
