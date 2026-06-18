import {
  json,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'PROCESSING',
  'PAID',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
]);

export const payments = pgTable('payments', {
  id: varchar('id', { length: 36 }).primaryKey(),
  orderId: varchar('order_id', { length: 36 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 32 }).notNull(),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('PENDING'),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  transactionId: varchar('transaction_id', { length: 100 }),
  gatewayTransactionId: varchar('gateway_transaction_id', { length: 255 }),
  gatewayResponse: json('gateway_response').$type<Record<string, unknown>>(),
  idempotencyKey: varchar('idempotency_key', { length: 64 }),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const paymentHistory = pgTable('payment_history', {
  id: varchar('id', { length: 36 }).primaryKey(),
  paymentId: varchar('payment_id', { length: 36 }).notNull(),
  status: paymentStatusEnum('status').notNull(),
  message: text('message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type PaymentHistory = typeof paymentHistory.$inferSelect;
export type NewPaymentHistory = typeof paymentHistory.$inferInsert;
