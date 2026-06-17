import {
  decimal,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';

export const paymentStatusEnum = mysqlEnum('payment_status', [
  'PENDING',
  'PROCESSING',
  'PAID',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
]);

export const payments = mysqlTable('payments', {
  id: varchar('id', { length: 36 }).primaryKey(),
  orderId: varchar('order_id', { length: 36 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 32 }).notNull(),
  paymentStatus: paymentStatusEnum.notNull().default('PENDING'),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  transactionId: varchar('transaction_id', { length: 100 }),
  gatewayTransactionId: varchar('gateway_transaction_id', { length: 255 }),
  gatewayResponse: json('gateway_response').$type<Record<string, unknown>>(),
  idempotencyKey: varchar('idempotency_key', { length: 64 }),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const paymentHistory = mysqlTable('payment_history', {
  id: varchar('id', { length: 36 }).primaryKey(),
  paymentId: varchar('payment_id', { length: 36 }).notNull(),
  status: paymentStatusEnum.notNull(),
  message: text('message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type PaymentHistory = typeof paymentHistory.$inferSelect;
export type NewPaymentHistory = typeof paymentHistory.$inferInsert;
