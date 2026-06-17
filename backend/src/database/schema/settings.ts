import { mysqlTable, text, timestamp, varchar } from 'drizzle-orm/mysql-core';

export const settings = mysqlTable('settings', {
  id: varchar('id', { length: 36 }).primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
