import {
  decimal,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';

export const orders = mysqlTable('orders', {
  id: varchar('id', { length: 36 }).primaryKey(),
  orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  status: mysqlEnum('status', [
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ])
    .notNull()
    .default('pending'),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 12, scale: 2 }).default('0'),
  shippingFee: decimal('shipping_fee', { precision: 12, scale: 2 }).default(
    '0',
  ),
  total: decimal('total', { precision: 12, scale: 2 }).notNull(),
  shippingAddress: json('shipping_address').$type<Record<string, string>>(),
  note: text('note'),
  voucherCode: varchar('voucher_code', { length: 50 }),
  paymentMethod: varchar('payment_method', { length: 50 }).default('cod'),
  paymentStatus: mysqlEnum('payment_status', [
    'unpaid',
    'pending',
    'processing',
    'paid',
    'failed',
    'cancelled',
    'refunded',
  ])
    .notNull()
    .default('unpaid'),
  cancelReason: text('cancel_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const orderStatusHistory = mysqlTable('order_status_history', {
  id: varchar('id', { length: 36 }).primaryKey(),
  orderId: varchar('order_id', { length: 36 }).notNull(),
  status: mysqlEnum('status', [
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ]).notNull(),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orderItems = mysqlTable('order_items', {
  id: varchar('id', { length: 36 }).primaryKey(),
  orderId: varchar('order_id', { length: 36 }).notNull(),
  productId: varchar('product_id', { length: 36 }).notNull(),
  variantId: varchar('variant_id', { length: 36 }),
  variantName: varchar('variant_name', { length: 255 }),
  sku: varchar('sku', { length: 100 }),
  productName: varchar('product_name', { length: 255 }).notNull(),
  productImage: varchar('product_image', { length: 500 }),
  quantity: decimal('quantity', { precision: 10, scale: 0 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 12, scale: 2 }).notNull(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type NewOrderStatusHistory = typeof orderStatusHistory.$inferInsert;
