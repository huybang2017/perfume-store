import { Injectable } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import {
  notifications,
  NewNotification,
} from '../../../database/schema/notifications';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@Injectable()
export class NotificationRepository extends BaseRepository {
  async findById(id: string) {
    const [row] = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);
    return row;
  }

  async create(data: NewNotification) {
    await this.db.insert(notifications).values(data);
    return await this.findById(data.id);
  }

  async markRead(id: string, userId: string) {
    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
    return this.findById(id);
  }

  async findByUser(
    userId: string,
    query: PaginationQueryDto,
    unreadOnly?: boolean,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;
    const where = unreadOnly
      ? and(eq(notifications.userId, userId), eq(notifications.isRead, false))
      : eq(notifications.userId, userId);

    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(notifications)
        .where(where)
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(where),
    ]);
    return { data, total: Number(countResult[0]?.count ?? 0) };
  }
}
