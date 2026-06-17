import { Module } from '@nestjs/common';
import { SettingController } from './controllers/setting.controller';
import { SettingRepository } from './repositories/setting.repository';
import { SettingService } from './services/setting.service';

@Module({
  controllers: [SettingController],
  providers: [SettingService, SettingRepository],
})
export class SettingsModule {}
