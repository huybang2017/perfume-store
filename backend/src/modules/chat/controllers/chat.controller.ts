import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/constants';
import { GuestIdDto, GuestSendMessageDto } from '../dto/guest-chat.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { ChatService } from '../services/chat.service';

@ApiTags('Chat')
@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /* ── Customer (authenticated) ── */

  @ApiBearerAuth()
  @Post('chat/conversations/start')
  startConversation(@CurrentUser('id') userId: string) {
    return this.chatService.ensureConversation(userId);
  }

  @ApiBearerAuth()
  @Post('chat/conversations/link-guest')
  linkGuest(
    @CurrentUser('id') userId: string,
    @Body() dto: GuestIdDto,
  ) {
    return this.chatService.linkGuestConversation(dto.guestId, userId);
  }

  @ApiBearerAuth()
  @Get('chat/conversations/:id/messages')
  getMessagesAuth(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.getMessagesForCustomer(id, userId);
  }

  @ApiBearerAuth()
  @Post('chat/messages')
  async sendMessageAuth(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: SendMessageDto,
  ) {
    const message = await this.chatService.sendMessage(
      userId,
      role as 'customer' | 'admin' | 'staff',
      dto,
    );
    return { success: true, message: 'Success', data: message };
  }

  /* ── Guest (public) ── */

  @Public()
  @Post('chat/guest/conversations/start')
  startGuestConversation(@Body() dto: GuestIdDto) {
    return this.chatService.ensureGuestConversation(dto.guestId);
  }

  @Public()
  @Get('chat/guest/conversations/:id/messages')
  getGuestMessages(
    @Param('id') id: string,
    @Query('guestId') guestId: string,
  ) {
    return this.chatService.getMessagesForCustomer(id, undefined, guestId);
  }

  @Public()
  @Post('chat/guest/messages')
  async sendGuestMessage(@Body() dto: GuestSendMessageDto) {
    const message = await this.chatService.sendGuestMessage(
      dto.guestId,
      dto.conversationId,
      dto.content,
    );
    return { success: true, message: 'Success', data: message };
  }

  /* ── Admin ── */

  @ApiBearerAuth()
  @Get('admin/chat/conversations')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  getAdminConversations() {
    return this.chatService.getConversations();
  }

  @ApiBearerAuth()
  @Get('chat/conversations')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  getConversations() {
    return this.chatService.getConversations();
  }

  @ApiBearerAuth()
  @Get('admin/chat/conversations/:id/messages')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  getAdminMessages(@Param('id') id: string) {
    return this.chatService.getMessages(id);
  }

  @ApiBearerAuth()
  @Post('admin/chat/conversations/:id/messages')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async sendAdminMessage(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { content: string },
  ) {
    const message = await this.chatService.sendMessage(userId, 'admin', {
      conversationId,
      content: body.content,
    });
    return { success: true, message: 'Success', data: message };
  }

  @ApiBearerAuth()
  @Post('admin/chat/conversations/:id/read')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  markRead(@Param('id') id: string) {
    return this.chatService.markAsRead(id);
  }

  @ApiBearerAuth()
  @Get('chat/unread-count')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  unreadCount() {
    return this.chatService.getUnreadCount();
  }
}
