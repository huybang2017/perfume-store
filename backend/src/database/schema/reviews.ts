import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';

export const reviews = mysqlTable('reviews', {
  id: varchar('id', { length: 36 }).primaryKey(),
  productId: varchar('product_id', { length: 36 }).notNull(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  rating: int('rating').notNull(),
  comment: text('comment'),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected'])
    .notNull()
    .default('approved'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
