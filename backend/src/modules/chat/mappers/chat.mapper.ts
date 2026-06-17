import { chatMessages, conversations } from '../../../database/schema/chats';

type MessageRow = typeof chatMessages.$inferSelect;
type ConversationRow = typeof conversations.$inferSelect;

export class ChatMapper {
  static toMessage(row: MessageRow) {
    return {
      id: row.id,
      conversationId: row.conversationId,
      senderId: row.senderId,
      senderType: row.senderRole === 'customer' ? 'CUSTOMER' : 'ADMIN',
      senderRole: row.senderRole,
      content: row.content,
      imageUrl: row.imageUrl,
      productId: row.productId,
      isRead: !!row.isRead,
      createdAt: row.createdAt.toISOString(),
    };
  }

  static toConversation(
    row: ConversationRow,
    extras?: {
      customerName?: string | null;
      customerEmail?: string | null;
      lastMessage?: string | null;
      unreadCount?: number;
    },
  ) {
    return {
      id: row.id,
      customerId: row.customerId,
      guestId: row.guestId,
      status: row.status,
      lastMessageAt: row.lastMessageAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      customerName: extras?.customerName ?? null,
      customerEmail: extras?.customerEmail ?? null,
      lastMessage: extras?.lastMessage ?? null,
      unreadCount: extras?.unreadCount ?? 0,
    };
  }
}
