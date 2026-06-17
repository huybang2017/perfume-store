import { Injectable } from '@nestjs/common';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import {
  refreshTokens,
  NewRefreshToken,
  RefreshToken,
} from '../../../database/schema/refresh-tokens';

@Injectable()
export class RefreshTokenRepository extends BaseRepository {
  async create(data: NewRefreshToken): Promise<RefreshToken> {
    await this.db.insert(refreshTokens).values(data);
    const [row] = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.id, data.id))
      .limit(1);
    return row;
  }

  async findValidByHash(tokenHash: string): Promise<RefreshToken | undefined> {
    const [row] = await this.db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.tokenHash, tokenHash),
          isNull(refreshTokens.revokedAt),
          gt(refreshTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);
    return row;
  }

  async revoke(id: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, id));
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)),
      );
  }
}
