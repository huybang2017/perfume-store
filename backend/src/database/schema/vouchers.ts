import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';

export const vouchers = mysqlTable('vouchers', {
  id: varchar('id', { length: 36 }).primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: varchar('description', { length: 500 }),
  type: mysqlEnum('type', ['percentage', 'fixed']).notNull(),
  value: decimal('value', { precision: 12, scale: 2 }).notNull(),
  minOrderAmount: decimal('min_order_amount', { precision: 12, scale: 2 }),
  maxDiscount: decimal('max_discount', { precision: 12, scale: 2 }),
  usageLimit: int('usage_limit'),
  usedCount: int('used_count').default(0),
  startsAt: timestamp('starts_at'),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Voucher = typeof vouchers.$inferSelect;
export type NewVoucher = typeof vouchers.$inferInsert;
