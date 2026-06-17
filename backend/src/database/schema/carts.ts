import { int, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';

export const carts = mysqlTable('carts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const cartItems = mysqlTable('cart_items', {
  id: varchar('id', { length: 36 }).primaryKey(),
  cartId: varchar('cart_id', { length: 36 }).notNull(),
  productId: varchar('product_id', { length: 36 }).notNull(),
  variantId: varchar('variant_id', { length: 36 }).notNull(),
  quantity: int('quantity').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Cart = typeof carts.$inferSelect;
export type NewCart = typeof carts.$inferInsert;
export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;
