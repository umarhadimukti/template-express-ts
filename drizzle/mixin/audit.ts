export const auditFields = <T extends Record<string, any>>(t: T) => ({
  createdAt: t.timestamp("created_at").defaultNow().notNull(),
  createdBy: t.varchar("created_by", { length: 100 }),
  updatedAt: t.timestamp("updated_at").defaultNow(),
  updatedBy: t.varchar("updated_by", { length: 100 }),
  deletedAt: t.timestamp("deleted_at"),
  deletedBy: t.varchar("deleted_by", { length: 100 }),
});
