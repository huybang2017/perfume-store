import { Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import {
  userAddresses,
  NewUserAddress,
  UserAddress,
} from '../../../database/schema/user-addresses';

@Injectable()
export class AddressRepository extends BaseRepository {
  async findByUser(userId: string): Promise<UserAddress[]> {
    return this.db
      .select()
      .from(userAddresses)
      .where(eq(userAddresses.userId, userId))
      .orderBy(desc(userAddresses.isDefault), desc(userAddresses.createdAt));
  }

  async findByIdForUser(
    id: string,
    userId: string,
  ): Promise<UserAddress | undefined> {
    const [row] = await this.db
      .select()
      .from(userAddresses)
      .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)))
      .limit(1);
    return row;
  }

  async create(data: NewUserAddress): Promise<UserAddress> {
    await this.db.insert(userAddresses).values(data);
    const row = await this.findByIdForUser(data.id, data.userId);
    return row!;
  }

  async update(
    id: string,
    userId: string,
    data: Partial<NewUserAddress>,
  ): Promise<UserAddress | undefined> {
    await this.db
      .update(userAddresses)
      .set(data)
      .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)));
    return this.findByIdForUser(id, userId);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.db
      .delete(userAddresses)
      .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)));
  }

  async clearDefaultForUser(userId: string): Promise<void> {
    await this.db
      .update(userAddresses)
      .set({ isDefault: false })
      .where(eq(userAddresses.userId, userId));
  }
}
