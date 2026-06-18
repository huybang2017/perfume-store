import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const conversationStatusEnum = pgEnum('conversation_status', [
  'open',
  'closed',
]);

export const chatSenderRoleEnum = pgEnum('chat_sender_role', [
  'customer',
  'admin',
  'staff',
]);

export const conversations = pgTable('conversations', {
  id: varchar('id', { length: 36 }).primaryKey(),
  customerId: varchar('customer_id', { length: 36 }),
  guestId: varchar('guest_id', { length: 36 }),
  assignedStaffId: varchar('assigned_staff_id', { length: 36 }),
  status: conversationStatusEnum('status').default('open'),
  lastMessageAt: timestamp('last_message_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const chatMessages = pgTable('chat_messages', {
  id: varchar('id', { length: 36 }).primaryKey(),
  conversationId: varchar('conversation_id', { length: 36 }).notNull(),
  senderId: varchar('sender_id', { length: 36 }).notNull(),
  senderRole: chatSenderRoleEnum('sender_role').notNull(),
  content: text('content'),
  imageUrl: varchar('image_url', { length: 500 }),
  productId: varchar('product_id', { length: 36 }),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
