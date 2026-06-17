import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { chatMessages, conversations } from '../../../database/schema/chats';
import { users } from '../../../database/schema/users';

@Injectable()
export class ChatRepository extends BaseRepository {
  async findConversationById(id: string) {
    const [row] = await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1);
    return row;
  }

  async findOpenByCustomerId(customerId: string) {
    const [existing] = await this.db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.customerId, customerId),
          eq(conversations.status, 'open'),
        ),
      )
      .orderBy(desc(conversations.lastMessageAt))
      .limit(1);
    return existing;
  }

  async findOpenByGuestId(guestId: string) {
    const [existing] = await this.db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.guestId, guestId),
          eq(conversations.status, 'open'),
        ),
      )
      .orderBy(desc(conversations.lastMessageAt))
      .limit(1);
    return existing;
  }

  async createConversation(data: typeof conversations.$inferInsert) {
    await this.db.insert(conversations).values(data);
    return this.findConversationById(data.id);
  }

  async linkGuestToCustomer(guestId: string, customerId: string) {
    await this.db
      .update(conversations)
      .set({ customerId, guestId: null })
      .where(eq(conversations.guestId, guestId));
  }

  async saveMessage(data: typeof chatMessages.$inferInsert) {
    await this.db.insert(chatMessages).values({
      ...data,
      createdAt: data.createdAt ?? new Date(),
    });
    await this.db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, data.conversationId));

    const [row] = await this.db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.id, data.id))
      .limit(1);
    return row!;
  }

  async getMessages(conversationId: string, limit = 100) {
    return this.db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(asc(chatMessages.createdAt))
      .limit(limit);
  }

  async listConversations() {
    const rows = await this.db
      .select({
        conversation: conversations,
        customerName: users.fullName,
        customerEmail: users.email,
      })
      .from(conversations)
      .leftJoin(users, eq(conversations.customerId, users.id))
      .orderBy(desc(conversations.lastMessageAt));

    const result = [];
    for (const row of rows) {
      const [last] = await this.db
        .select({ content: chatMessages.content })
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, row.conversation.id))
        .orderBy(desc(chatMessages.createdAt))
        .limit(1);

      const [unread] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.conversationId, row.conversation.id),
            eq(chatMessages.isRead, false),
            eq(chatMessages.senderRole, 'customer'),
          ),
        );

      result.push({
        ...row,
        lastMessage: last?.content ?? null,
        unreadCount: Number(unread?.count ?? 0),
      });
    }
    return result;
  }

  async markCustomerMessagesRead(conversationId: string) {
    await this.db
      .update(chatMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(chatMessages.conversationId, conversationId),
          eq(chatMessages.senderRole, 'customer'),
          eq(chatMessages.isRead, false),
        ),
      );
  }

  async countUnreadForStaff() {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.isRead, false),
          eq(chatMessages.senderRole, 'customer'),
        ),
      );
    return Number(result?.count ?? 0);
  }
}
