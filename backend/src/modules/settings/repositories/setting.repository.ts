import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { settings, NewSetting } from '../../../database/schema/settings';

@Injectable()
export class SettingRepository extends BaseRepository {
  async findAll() {
    return this.db.select().from(settings);
  }

  async findByKey(key: string) {
    const [row] = await this.db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1);
    return row;
  }

  async upsert(data: NewSetting) {
    const existing = await this.findByKey(data.key);
    if (existing) {
      await this.db
        .update(settings)
        .set({ value: data.value })
        .where(eq(settings.key, data.key));
      return await this.findByKey(data.key);
    }
    await this.db.insert(settings).values(data);
    return await this.findByKey(data.key);
  }
}
