import { Injectable } from '@nestjs/common';
import { and, eq, like, or, sql, desc, asc } from 'drizzle-orm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { users, User, NewUser } from '../../../database/schema/users';
import { UserQueryDto } from '../dto/user-query.dto';

@Injectable()
export class UserRepository extends BaseRepository {
  async findById(id: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user;
  }

  async create(data: NewUser): Promise<User> {
    await this.db.insert(users).values(data);
    const user = await this.findById(data.id);
    return user!;
  }

  async update(id: string, data: Partial<NewUser>): Promise<User | undefined> {
    await this.db.update(users).set(data).where(eq(users.id, id));
    return this.findById(id);
  }

  async findAll(query: UserQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const filters = [
      query.search
        ? or(
            like(users.email, `%${query.search}%`),
            like(users.fullName, `%${query.search}%`),
            like(users.phone, `%${query.search}%`),
          )
        : undefined,
      query.role ? eq(users.role, query.role) : undefined,
      query.isActive !== undefined
        ? eq(users.isActive, query.isActive)
        : undefined,
    ].filter(Boolean);

    const conditions = filters.length ? and(...filters) : undefined;

    const orderFn = query.sortOrder === 'asc' ? asc : desc;
    const sortColumn =
      query.sortBy === 'email'
        ? users.email
        : query.sortBy === 'fullName'
          ? users.fullName
          : users.createdAt;

    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(users)
        .where(conditions)
        .orderBy(orderFn(sortColumn))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(conditions),
    ]);

    return { data, total: Number(countResult[0]?.count ?? 0) };
  }

  async getStats(role?: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const baseFilter = role ? eq(users.role, role as User['role']) : undefined;

    const [totalRow, activeRow, newRow] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(baseFilter),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
          baseFilter
            ? and(baseFilter, eq(users.isActive, true))
            : eq(users.isActive, true),
        ),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
          baseFilter
            ? and(baseFilter, sql`${users.createdAt} >= ${thirtyDaysAgo}`)
            : sql`${users.createdAt} >= ${thirtyDaysAgo}`,
        ),
    ]);

    return {
      total: Number(totalRow[0]?.count ?? 0),
      active: Number(activeRow[0]?.count ?? 0),
      newCustomers: Number(newRow[0]?.count ?? 0),
    };
  }
}
