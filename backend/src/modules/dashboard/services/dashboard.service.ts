import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { orderItems } from '../../../database/schema/orders';
import { DRIZZLE } from '../../../common/constants';
import { successResponse } from '../../../common/utils/api-response.util';
import { orders } from '../../../database/schema/orders';
import { products } from '../../../database/schema/products';
import { users } from '../../../database/schema/users';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: ReturnType<
      typeof import('../../../database').createDrizzleClient
    >,
  ) {}

  async getStats() {
    const [[userCount], [productCount], [orderCount]] = await Promise.all([
      this.db.select({ count: sql<number>`count(*)` }).from(users),
      this.db.select({ count: sql<number>`count(*)` }).from(products),
      this.db.select({ count: sql<number>`count(*)` }).from(orders),
    ]);

    const [revenueRow] = await this.db
      .select({
        revenue: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
      })
      .from(orders)
      .where(sql`${orders.paymentStatus} = 'paid'`);

    return successResponse({
      totalUsers: Number(userCount?.count ?? 0),
      totalProducts: Number(productCount?.count ?? 0),
      totalOrders: Number(orderCount?.count ?? 0),
      revenue: Number(revenueRow?.revenue ?? 0),
    });
  }

  async getAnalytics(period = '30d') {
    const days =
      period === 'today' ? 1 : period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const daily = await this.db
      .select({
        day: sql<string>`DATE(${orders.createdAt})`,
        orders: sql<number>`count(*)`,
        revenue: sql<number>`COALESCE(SUM(CASE WHEN ${orders.paymentStatus} = 'paid' THEN ${orders.total} ELSE 0 END), 0)`,
      })
      .from(orders)
      .where(sql`${orders.createdAt} >= ${since}`)
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt})`);

    const topProducts = await this.db
      .select({
        productId: orderItems.productId,
        productName: orderItems.productName,
        sold: sql<number>`SUM(${orderItems.quantity})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(sql`${orders.createdAt} >= ${since}`)
      .groupBy(orderItems.productId, orderItems.productName)
      .orderBy(sql`SUM(${orderItems.quantity}) DESC`)
      .limit(5);

    return successResponse({ daily, topProducts, period });
  }
}
