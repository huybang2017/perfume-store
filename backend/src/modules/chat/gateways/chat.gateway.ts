import { forwardRef, Inject } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../services/chat.service';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token as string | undefined;
    const guestId = client.handshake.auth?.guestId as string | undefined;

    if (token) {
      try {
        const payload = this.jwtService.verify<{
          sub: string;
          role: 'customer' | 'admin' | 'staff';
        }>(token, {
          secret: this.config.getOrThrow<string>('jwt.secret'),
        });
        client.data.userId = payload.sub;
        client.data.role = payload.role ?? 'customer';
        client.join(`user:${payload.sub}`);

        if (payload.role === 'admin' || payload.role === 'staff') {
          client.join('admin:inbox');
        }
        return;
      } catch {
        client.disconnect();
        return;
      }
    }

    if (guestId) {
      client.data.guestId = guestId;
      client.data.role = 'guest';
      client.data.userId = guestId;
      return;
    }

    client.disconnect();
  }

  broadcastMessage(
    conversationId: string,
    message: Awaited<ReturnType<ChatService['sendMessage']>>,
  ) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('message:new', message);
    this.server
      .to(`conversation:${conversationId}`)
      .emit('new_message', message);
    this.server.to('admin:inbox').emit('conversation:updated', {
      conversationId,
      message,
    });
  }

  @SubscribeMessage('chat:join')
  handleChatJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    return this.joinConversation(client, data);
  }

  @SubscribeMessage('join_conversation')
  handleLegacyJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    return this.joinConversation(client, data);
  }

  private joinConversation(
    client: Socket,
    data: { conversationId: string },
  ) {
    if (!client.data.userId && !client.data.guestId) {
      return { event: 'error', data: 'Unauthorized' };
    }
    client.join(`conversation:${data.conversationId}`);
    return { event: 'joined', data };
  }

  @SubscribeMessage('admin:join')
  handleAdminJoin(@ConnectedSocket() client: Socket) {
    const role = client.data.role as string | undefined;
    if (role !== 'admin' && role !== 'staff') {
      return { event: 'error', data: 'Unauthorized' };
    }
    client.join('admin:inbox');
    return { event: 'joined', data: { room: 'admin:inbox' } };
  }

  @SubscribeMessage('chat:message')
  async handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      conversationId: string;
      content?: string;
      imageUrl?: string;
      productId?: string;
    },
  ) {
    const senderId = (client.data.userId ?? client.data.guestId) as
      | string
      | undefined;
    const role = client.data.role as string | undefined;

    if (!senderId) {
      return { event: 'error', data: 'Unauthorized' };
    }

    const senderRole =
      role === 'admin' || role === 'staff' ? 'admin' : 'customer';

    const message = await this.chatService.sendMessage(senderId, senderRole, {
      conversationId: payload.conversationId,
      content: payload.content,
      imageUrl: payload.imageUrl,
      productId: payload.productId,
    });

    return { event: 'message_sent', data: message };
  }

  @SubscribeMessage('send_message')
  async handleLegacyMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      conversationId: string;
      content?: string;
      imageUrl?: string;
      productId?: string;
    },
  ) {
    return this.handleChatMessage(client, payload);
  }

  @SubscribeMessage('admin:message')
  async handleAdminMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { conversationId: string; content?: string },
  ) {
    const senderId = client.data.userId as string | undefined;
    const role = client.data.role as string | undefined;

    if (!senderId || (role !== 'admin' && role !== 'staff')) {
      return { event: 'error', data: 'Unauthorized' };
    }

    const message = await this.chatService.sendMessage(senderId, 'admin', {
      conversationId: payload.conversationId,
      content: payload.content,
    });

    return { event: 'message_sent', data: message };
  }
}
