import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, like, or, sql } from 'drizzle-orm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import {
  vouchers,
  Voucher,
  NewVoucher,
} from '../../../database/schema/vouchers';
import { VoucherQueryDto } from '../dto/voucher-query.dto';

@Injectable()
export class VoucherRepository extends BaseRepository {
  async findById(id: string): Promise<Voucher | undefined> {
    const [row] = await this.db
      .select()
      .from(vouchers)
      .where(eq(vouchers.id, id))
      .limit(1);
    return row;
  }

  async findByCode(code: string): Promise<Voucher | undefined> {
    const [row] = await this.db
      .select()
      .from(vouchers)
      .where(eq(vouchers.code, code.toUpperCase()))
      .limit(1);
    return row;
  }

  async create(data: NewVoucher): Promise<Voucher> {
    await this.db.insert(vouchers).values({
      ...data,
      code: data.code.toUpperCase(),
    });
    return (await this.findById(data.id))!;
  }

  async update(
    id: string,
    data: Partial<NewVoucher>,
  ): Promise<Voucher | undefined> {
    const payload = { ...data };
    if (payload.code) payload.code = payload.code.toUpperCase();
    await this.db.update(vouchers).set(payload).where(eq(vouchers.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(vouchers).where(eq(vouchers.id, id));
  }

  async incrementUsedCount(id: string): Promise<void> {
    const voucher = await this.findById(id);
    if (!voucher) return;
    await this.db
      .update(vouchers)
      .set({ usedCount: (voucher.usedCount ?? 0) + 1 })
      .where(eq(vouchers.id, id));
  }

  async findAll(query: VoucherQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const filters = [
      query.isActive !== undefined
        ? eq(vouchers.isActive, query.isActive)
        : undefined,
      query.search
        ? or(
            like(vouchers.code, `%${query.search}%`),
            like(vouchers.description, `%${query.search}%`),
          )
        : undefined,
    ].filter(Boolean);

    const whereClause = filters.length ? and(...filters) : undefined;
    const orderFn = query.sortOrder === 'asc' ? asc : desc;

    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(vouchers)
        .where(whereClause)
        .orderBy(orderFn(vouchers.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(vouchers)
        .where(whereClause),
    ]);

    return { data, total: Number(countResult[0]?.count ?? 0) };
  }

  async getStats() {
    const now = new Date();
    const [activeRow, expiredRow, usedRow] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(vouchers)
        .where(
          and(
            eq(vouchers.isActive, true),
            sql`(${vouchers.expiresAt} IS NULL OR ${vouchers.expiresAt} > ${now})`,
          ),
        ),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(vouchers)
        .where(
          sql`${vouchers.expiresAt} IS NOT NULL AND ${vouchers.expiresAt} <= ${now}`,
        ),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(vouchers)
        .where(sql`${vouchers.usedCount} > 0`),
    ]);

    return {
      active: Number(activeRow[0]?.count ?? 0),
      expired: Number(expiredRow[0]?.count ?? 0),
      used: Number(usedRow[0]?.count ?? 0),
    };
  }
}
