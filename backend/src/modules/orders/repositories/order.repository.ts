import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { and, asc, desc, eq, inArray, like, or, sql } from 'drizzle-orm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import {
  orders,
  orderItems,
  orderStatusHistory,
  Order,
  NewOrder,
  NewOrderItem,
  OrderItem,
  OrderStatusHistory,
} from '../../../database/schema/orders';
import { OrderQueryDto, OrderSortOption } from '../dto/order-query.dto';
import { OrderStatus } from '../../../common/constants';

@Injectable()
export class OrderRepository extends BaseRepository {
  async findById(id: string): Promise<Order | undefined> {
    const [row] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);
    return row;
  }

  async findItemsByOrderId(orderId: string): Promise<OrderItem[]> {
    return this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  async findStatusHistory(orderId: string): Promise<OrderStatusHistory[]> {
    return this.db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, orderId))
      .orderBy(asc(orderStatusHistory.createdAt));
  }

  async addStatusHistory(
    orderId: string,
    status: Order['status'],
    note?: string | null,
  ) {
    await this.db.insert(orderStatusHistory).values({
      id: randomUUID(),
      orderId,
      status,
      note: note ?? null,
    });
  }

  async findByIdWithItems(id: string) {
    const order = await this.findById(id);
    if (!order) return undefined;
    const items = await this.findItemsByOrderId(id);
    const statusHistory = await this.findStatusHistory(id);
    return { order, items, statusHistory };
  }

  async createWithItems(
    order: NewOrder,
    items: NewOrderItem[],
  ): Promise<Order> {
    await this.db.transaction(async (tx) => {
      await tx.insert(orders).values(order);
      if (items.length) {
        await tx.insert(orderItems).values(items);
      }
      await tx.insert(orderStatusHistory).values({
        id: randomUUID(),
        orderId: order.id,
        status: order.status ?? 'pending',
        note: 'Order placed',
      });
    });
    return (await this.findById(order.id))!;
  }

  async updateStatus(
    id: string,
    status: Order['status'],
    note?: string | null,
  ): Promise<Order | undefined> {
    await this.db.update(orders).set({ status }).where(eq(orders.id, id));
    await this.addStatusHistory(id, status, note);
    return this.findById(id);
  }

  async setCancelReason(id: string, reason: string) {
    await this.db
      .update(orders)
      .set({ cancelReason: reason })
      .where(eq(orders.id, id));
  }

  async update(
    id: string,
    data: Partial<NewOrder>,
  ): Promise<Order | undefined> {
    await this.db.update(orders).set(data).where(eq(orders.id, id));
    return this.findById(id);
  }

  async updatePaymentStatus(id: string, paymentStatus: Order['paymentStatus']) {
    await this.db
      .update(orders)
      .set({ paymentStatus })
      .where(eq(orders.id, id));
  }

  async findAll(query: OrderQueryDto, userId?: string) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;
    const search = query.search?.trim() || query.productSearch?.trim();

    let searchFilter;
    if (search) {
      const productMatches = await this.db
        .selectDistinct({ orderId: orderItems.orderId })
        .from(orderItems)
        .where(like(orderItems.productName, `%${search}%`));
      const productOrderIds = productMatches.map((r) => r.orderId);
      searchFilter = or(
        like(orders.orderNumber, `%${search}%`),
        productOrderIds.length
          ? inArray(orders.id, productOrderIds)
          : undefined,
      );
    }

    const filters = [
      userId ? eq(orders.userId, userId) : undefined,
      query.status ? eq(orders.status, query.status) : undefined,
      query.paymentStatus
        ? eq(
            orders.paymentStatus,
            query.paymentStatus as Order['paymentStatus'],
          )
        : undefined,
      query.paymentMethod
        ? sql`${orders.paymentMethod} = ${query.paymentMethod}`
        : undefined,
      query.dateFrom
        ? sql`${orders.createdAt} >= ${query.dateFrom}`
        : undefined,
      query.dateTo ? sql`${orders.createdAt} <= ${query.dateTo}` : undefined,
      searchFilter,
    ].filter(Boolean);

    const whereClause = filters.length ? and(...filters) : undefined;
    const sort = query.sort ?? OrderSortOption.NEWEST;
    const orderBy =
      sort === OrderSortOption.OLDEST
        ? asc(orders.createdAt)
        : sort === OrderSortOption.TOTAL_ASC
          ? asc(orders.total)
          : sort === OrderSortOption.TOTAL_DESC
            ? desc(orders.total)
            : desc(orders.createdAt);

    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(orders)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(whereClause),
    ]);

    const ordersWithMeta = await Promise.all(
      data.map(async (order) => {
        const items = await this.findItemsByOrderId(order.id);
        return {
          order,
          itemCount: items.length,
          previewItems: items.slice(0, 2),
        };
      }),
    );

    return { data: ordersWithMeta, total: Number(countResult[0]?.count ?? 0) };
  }

  async getAdminStats() {
    const rows = await this.db
      .select({
        status: orders.status,
        count: sql<number>`count(*)`,
      })
      .from(orders)
      .groupBy(orders.status);
    const map: Record<string, number> = {};
    let total = 0;
    for (const r of rows) {
      map[r.status] = Number(r.count);
      total += Number(r.count);
    }
    return {
      total,
      pending: map.pending ?? 0,
      confirmed: map.confirmed ?? 0,
      processing: map.processing ?? 0,
      shipped: map.shipped ?? 0,
      delivered: map.delivered ?? 0,
      cancelled: map.cancelled ?? 0,
    };
  }

  async getMyStats(userId: string) {
    const rows = await this.db
      .select({
        status: orders.status,
        count: sql<number>`count(*)`,
      })
      .from(orders)
      .where(eq(orders.userId, userId))
      .groupBy(orders.status);

    const map = Object.fromEntries(
      rows.map((r) => [r.status, Number(r.count)]),
    );

    const total = Object.values(map).reduce((a, b) => a + b, 0);
    const processing =
      (map[OrderStatus.PENDING] ?? 0) +
      (map[OrderStatus.CONFIRMED] ?? 0) +
      (map[OrderStatus.PROCESSING] ?? 0);
    const shipping = map[OrderStatus.SHIPPED] ?? 0;
    const completed = map[OrderStatus.DELIVERED] ?? 0;
    const cancelled = map[OrderStatus.CANCELLED] ?? 0;

    return { total, processing, shipping, completed, cancelled };
  }
}
