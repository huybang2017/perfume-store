import {
  boolean,
  decimal,
  int,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

export const productVariants = mysqlTable(
  'product_variants',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    productId: varchar('product_id', { length: 36 }).notNull(),
    sku: varchar('sku', { length: 100 }).notNull(),
    price: decimal('price', { precision: 12, scale: 2 }).notNull(),
    comparePrice: decimal('compare_price', { precision: 12, scale: 2 }),
    stock: int('stock').notNull().default(0),
    weight: decimal('weight', { precision: 10, scale: 2 }),
    isActive: boolean('is_active').notNull().default(true),
    imageUrl: varchar('image_url', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (t) => ({
    skuUnique: uniqueIndex('product_variants_sku').on(t.sku),
  }),
);

export const productOptions = mysqlTable('product_options', {
  id: varchar('id', { length: 36 }).primaryKey(),
  productId: varchar('product_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  sortOrder: int('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const productOptionValues = mysqlTable('product_option_values', {
  id: varchar('id', { length: 36 }).primaryKey(),
  optionId: varchar('option_id', { length: 36 }).notNull(),
  value: varchar('value', { length: 100 }).notNull(),
  sortOrder: int('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const variantOptionValues = mysqlTable(
  'variant_option_values',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    variantId: varchar('variant_id', { length: 36 }).notNull(),
    optionValueId: varchar('option_value_id', { length: 36 }).notNull(),
  },
  (t) => ({
    variantOptionUnique: uniqueIndex('variant_option_unique').on(
      t.variantId,
      t.optionValueId,
    ),
  }),
);

export const productImages = mysqlTable('product_images', {
  id: varchar('id', { length: 36 }).primaryKey(),
  productId: varchar('product_id', { length: 36 }).notNull(),
  variantId: varchar('variant_id', { length: 36 }),
  imageUrl: varchar('image_url', { length: 500 }).notNull(),
  sortOrder: int('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
export type ProductOption = typeof productOptions.$inferSelect;
export type NewProductOption = typeof productOptions.$inferInsert;
export type ProductOptionValue = typeof productOptionValues.$inferSelect;
export type NewProductOptionValue = typeof productOptionValues.$inferInsert;
export type VariantOptionValue = typeof variantOptionValues.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;
