import { Injectable } from '@nestjs/common';
import { and, desc, eq, like, sql } from 'drizzle-orm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import {
  payments,
  paymentHistory,
  Payment,
  NewPayment,
  PaymentHistory,
} from '../../../database/schema/payments';
import { PaymentStatus } from '../../../common/constants/payment.constants';
import { PaymentQueryDto } from '../dto/payment-query.dto';

@Injectable()
export class PaymentRepository extends BaseRepository {
  async create(data: NewPayment): Promise<Payment> {
    await this.db.insert(payments).values(data);
    return (await this.findById(data.id))!;
  }

  async findById(id: string): Promise<Payment | undefined> {
    const [row] = await this.db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);
    return row;
  }

  async findByOrderId(orderId: string): Promise<Payment | undefined> {
    const [row] = await this.db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .orderBy(desc(payments.createdAt))
      .limit(1);
    return row;
  }

  async findByTransactionId(
    transactionId: string,
  ): Promise<Payment | undefined> {
    const [row] = await this.db
      .select()
      .from(payments)
      .where(eq(payments.transactionId, transactionId))
      .limit(1);
    return row;
  }

  async findByIdempotencyKey(key: string): Promise<Payment | undefined> {
    const [row] = await this.db
      .select()
      .from(payments)
      .where(eq(payments.idempotencyKey, key))
      .limit(1);
    return row;
  }

  async update(
    id: string,
    data: Partial<NewPayment>,
  ): Promise<Payment | undefined> {
    await this.db.update(payments).set(data).where(eq(payments.id, id));
    return this.findById(id);
  }

  async addHistory(
    paymentId: string,
    status: PaymentStatus,
    message?: string,
  ): Promise<PaymentHistory> {
    const { randomUUID } = await import('crypto');
    const id = randomUUID();
    await this.db.insert(paymentHistory).values({
      id,
      paymentId,
      status,
      message: message ?? null,
    });
    const [row] = await this.db
      .select()
      .from(paymentHistory)
      .where(eq(paymentHistory.id, id))
      .limit(1);
    return row;
  }

  async getHistory(paymentId: string): Promise<PaymentHistory[]> {
    return this.db
      .select()
      .from(paymentHistory)
      .where(eq(paymentHistory.paymentId, paymentId))
      .orderBy(paymentHistory.createdAt);
  }

  async findAll(query: PaymentQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const filters = [
      query.status ? eq(payments.paymentStatus, query.status) : undefined,
      query.method ? eq(payments.paymentMethod, query.method) : undefined,
      query.search
        ? like(payments.transactionId, `%${query.search}%`)
        : undefined,
    ].filter(Boolean);

    const whereClause = filters.length ? and(...filters) : undefined;

    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(payments)
        .where(whereClause)
        .orderBy(desc(payments.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(payments)
        .where(whereClause),
    ]);

    return { data, total: Number(countResult[0]?.count ?? 0) };
  }

  async getStats() {
    const rows = await this.db
      .select({
        status: payments.paymentStatus,
        count: sql<number>`count(*)`,
      })
      .from(payments)
      .groupBy(payments.paymentStatus);

    const map: Record<string, number> = {};
    let total = 0;
    for (const r of rows) {
      map[r.status] = Number(r.count);
      total += Number(r.count);
    }

    return {
      total,
      successful: map.PAID ?? 0,
      failed: map.FAILED ?? 0,
      refunded: map.REFUNDED ?? 0,
      pending: (map.PENDING ?? 0) + (map.PROCESSING ?? 0),
    };
  }
}
