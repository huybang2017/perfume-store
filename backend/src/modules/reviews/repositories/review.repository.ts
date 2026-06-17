import { Injectable } from '@nestjs/common';
import { and, desc, eq, like, sql } from 'drizzle-orm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { reviews, NewReview } from '../../../database/schema/reviews';
import { users } from '../../../database/schema/users';
import { products } from '../../../database/schema/products';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@Injectable()
export class ReviewRepository extends BaseRepository {
  async findById(id: string) {
    const [row] = await this.db
      .select()
      .from(reviews)
      .where(eq(reviews.id, id))
      .limit(1);
    return row;
  }

  async create(data: NewReview) {
    await this.db.insert(reviews).values(data);
    return await this.findById(data.id);
  }

  async delete(id: string) {
    await this.db.delete(reviews).where(eq(reviews.id, id));
  }

  async updateStatus(id: string, status: 'pending' | 'approved' | 'rejected') {
    await this.db.update(reviews).set({ status }).where(eq(reviews.id, id));
    return this.findById(id);
  }

  async findAllAdmin(
    query: PaginationQueryDto & {
      status?: string;
      rating?: number;
      productSearch?: string;
    },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;
    const filters = [
      query.status
        ? eq(
            reviews.status,
            query.status as 'pending' | 'approved' | 'rejected',
          )
        : undefined,
      query.rating ? eq(reviews.rating, query.rating) : undefined,
      query.search ? like(users.fullName, `%${query.search}%`) : undefined,
      query.productSearch
        ? like(products.name, `%${query.productSearch}%`)
        : undefined,
    ].filter(Boolean);
    const where = filters.length ? and(...filters) : undefined;

    const [data, countResult] = await Promise.all([
      this.db
        .select({
          id: reviews.id,
          productId: reviews.productId,
          userId: reviews.userId,
          rating: reviews.rating,
          comment: reviews.comment,
          status: reviews.status,
          createdAt: reviews.createdAt,
          userName: users.fullName,
          productName: products.name,
        })
        .from(reviews)
        .innerJoin(users, eq(reviews.userId, users.id))
        .innerJoin(products, eq(reviews.productId, products.id))
        .where(where)
        .orderBy(desc(reviews.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(reviews)
        .innerJoin(users, eq(reviews.userId, users.id))
        .innerJoin(products, eq(reviews.productId, products.id))
        .where(where),
    ]);
    return { data, total: Number(countResult[0]?.count ?? 0) };
  }

  async getStats() {
    const rows = await this.db
      .select({ status: reviews.status, count: sql<number>`count(*)` })
      .from(reviews)
      .groupBy(reviews.status);
    const map: Record<string, number> = {};
    let total = 0;
    for (const r of rows) {
      map[r.status] = Number(r.count);
      total += Number(r.count);
    }
    return {
      total,
      pending: map.pending ?? 0,
      approved: map.approved ?? 0,
      rejected: map.rejected ?? 0,
    };
  }

  async findByProduct(productId: string, query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;
    const where = eq(reviews.productId, productId);

    const [data, countResult] = await Promise.all([
      this.db
        .select({
          id: reviews.id,
          productId: reviews.productId,
          userId: reviews.userId,
          rating: reviews.rating,
          comment: reviews.comment,
          createdAt: reviews.createdAt,
          userName: users.fullName,
        })
        .from(reviews)
        .innerJoin(users, eq(reviews.userId, users.id))
        .where(where)
        .orderBy(desc(reviews.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(reviews)
        .where(where),
    ]);
    return { data, total: Number(countResult[0]?.count ?? 0) };
  }
}
