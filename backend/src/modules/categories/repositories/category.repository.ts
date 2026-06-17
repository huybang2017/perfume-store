import { Injectable } from '@nestjs/common';
import { asc, desc, eq, like, sql } from 'drizzle-orm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { categories, NewCategory } from '../../../database/schema/categories';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@Injectable()
export class CategoryRepository extends BaseRepository {
  async findById(id: string) {
    const [row] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    return row;
  }

  async findBySlug(slug: string) {
    const [row] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);
    return row;
  }

  async create(data: NewCategory) {
    await this.db.insert(categories).values(data);
    return await this.findById(data.id);
  }

  async update(id: string, data: Partial<NewCategory>) {
    await this.db.update(categories).set(data).where(eq(categories.id, id));
    return this.findById(id);
  }

  async delete(id: string) {
    await this.db.delete(categories).where(eq(categories.id, id));
  }

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;
    const where = query.search
      ? like(categories.name, `%${query.search}%`)
      : undefined;
    const orderFn = query.sortOrder === 'asc' ? asc : desc;

    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(categories)
        .where(where)
        .orderBy(orderFn(categories.sortOrder))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(categories)
        .where(where),
    ]);
    return { data, total: Number(countResult[0]?.count ?? 0) };
  }
}
