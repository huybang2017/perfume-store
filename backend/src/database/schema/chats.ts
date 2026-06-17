import {
  boolean,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';

export const conversations = mysqlTable('conversations', {
  id: varchar('id', { length: 36 }).primaryKey(),
  customerId: varchar('customer_id', { length: 36 }),
  guestId: varchar('guest_id', { length: 36 }),
  assignedStaffId: varchar('assigned_staff_id', { length: 36 }),
  status: mysqlEnum('status', ['open', 'closed']).default('open'),
  lastMessageAt: timestamp('last_message_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const chatMessages = mysqlTable('chat_messages', {
  id: varchar('id', { length: 36 }).primaryKey(),
  conversationId: varchar('conversation_id', { length: 36 }).notNull(),
  senderId: varchar('sender_id', { length: 36 }).notNull(),
  senderRole: mysqlEnum('sender_role', [
    'customer',
    'admin',
    'staff',
  ]).notNull(),
  content: text('content'),
  imageUrl: varchar('image_url', { length: 500 }),
  productId: varchar('product_id', { length: 36 }),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
