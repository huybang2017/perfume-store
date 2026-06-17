import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import {
  paginationMeta,
  successResponse,
} from '../../../common/utils/api-response.util';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { NotificationRepository } from '../repositories/notification.repository';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async findMine(
    userId: string,
    query: PaginationQueryDto,
    unreadOnly?: boolean,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { data, total } = await this.notificationRepository.findByUser(
      userId,
      query,
      unreadOnly,
    );
    return successResponse(
      data,
      'Notifications retrieved',
      paginationMeta(page, limit, total),
    );
  }

  async markRead(userId: string, id: string) {
    const notification = await this.notificationRepository.markRead(id, userId);
    if (!notification)
      throw new BusinessException('Notification not found', 404);
    return successResponse(notification, 'Marked as read');
  }

  async create(dto: CreateNotificationDto) {
    const notification = await this.notificationRepository.create({
      id: randomUUID(),
      userId: dto.userId,
      title: dto.title,
      body: dto.body,
      isRead: false,
    });
    return successResponse(notification, 'Notification sent');
  }
}
