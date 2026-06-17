import {
  boolean,
  decimal,
  int,
  json,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';

export const products = mysqlTable('products', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  comparePrice: decimal('compare_price', { precision: 12, scale: 2 }),
  sku: varchar('sku', { length: 100 }).unique(),
  images: json('images').$type<string[]>().default([]),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  categoryId: varchar('category_id', { length: 36 }),
  brandId: varchar('brand_id', { length: 36 }),
  stock: int('stock').notNull().default(0),
  isFeatured: boolean('is_featured').default(false),
  isActive: boolean('is_active').notNull().default(true),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
