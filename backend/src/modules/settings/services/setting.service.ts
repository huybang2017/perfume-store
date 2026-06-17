import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { successResponse } from '../../../common/utils/api-response.util';
import { UpdateSettingDto } from '../dto/update-setting.dto';
import { SettingRepository } from '../repositories/setting.repository';

@Injectable()
export class SettingService {
  constructor(private readonly settingRepository: SettingRepository) {}

  async findAll() {
    const data = await this.settingRepository.findAll();
    return successResponse(data);
  }

  async findByKey(key: string) {
    const setting = await this.settingRepository.findByKey(key);
    if (!setting) throw new BusinessException('Setting not found', 404);
    return successResponse(setting);
  }

  async upsert(dto: UpdateSettingDto) {
    const setting = await this.settingRepository.upsert({
      id: randomUUID(),
      key: dto.key,
      value: dto.value,
    });
    return successResponse(setting, 'Setting saved');
  }
}
