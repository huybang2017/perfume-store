import {
  boolean,
  integer,
  json,
  numeric,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  comparePrice: numeric('compare_price', { precision: 12, scale: 2 }),
  sku: varchar('sku', { length: 100 }).unique(),
  images: json('images').$type<string[]>().default([]),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  categoryId: varchar('category_id', { length: 36 }),
  brandId: varchar('brand_id', { length: 36 }),
  stock: integer('stock').notNull().default(0),
  isFeatured: boolean('is_featured').default(false),
  isActive: boolean('is_active').notNull().default(true),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
