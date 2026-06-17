import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DRIZZLE } from '../common/constants';
import { createDrizzleClient, DrizzleDB } from './index';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): DrizzleDB => {
        const url = config.get<string>('DATABASE_URL');
        if (!url) throw new Error('DATABASE_URL is not configured');
        return createDrizzleClient(url);
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
