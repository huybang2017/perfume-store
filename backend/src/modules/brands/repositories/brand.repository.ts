import { Injectable } from '@nestjs/common';
import { eq, inArray, sql } from 'drizzle-orm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { brands } from '../../../database/schema/brands';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@Injectable()
export class BrandRepository extends BaseRepository {
  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;
    const [data, countResult] = await Promise.all([
      this.db.select().from(brands).limit(limit).offset(offset),
      this.db.select({ count: sql<number>`count(*)` }).from(brands),
    ]);
    return { data, total: Number(countResult[0]?.count ?? 0) };
  }

  async findById(id: string) {
    const [row] = await this.db
      .select()
      .from(brands)
      .where(eq(brands.id, id))
      .limit(1);
    return row;
  }

  async findBySlugs(slugs: string[]) {
    if (!slugs.length) return [];
    return this.db.select().from(brands).where(inArray(brands.slug, slugs));
  }

  async create(data: typeof brands.$inferInsert) {
    await this.db.insert(brands).values(data);
    return await this.findById(data.id);
  }

  async update(id: string, data: Partial<typeof brands.$inferInsert>) {
    await this.db.update(brands).set(data).where(eq(brands.id, id));
    return this.findById(id);
  }

  async delete(id: string) {
    await this.db.delete(brands).where(eq(brands.id, id));
  }
}
