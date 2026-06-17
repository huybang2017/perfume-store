import { Inject } from '@nestjs/common';
import { DRIZZLE } from '../constants';

export abstract class BaseRepository {
  constructor(
    @Inject(DRIZZLE)
    protected readonly db: ReturnType<
      typeof import('../../database').createDrizzleClient
    >,
  ) {}
}
