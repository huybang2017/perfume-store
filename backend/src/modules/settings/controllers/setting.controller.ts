import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/constants';
import { UpdateSettingDto } from '../dto/update-setting.dto';
import { SettingService } from '../services/setting.service';

@ApiTags('Settings')
@Controller('settings')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Public()
  @Get('public/:key')
  findPublic(@Param('key') key: string) {
    return this.settingService.findByKey(key);
  }

  @ApiBearerAuth()
  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.settingService.findAll();
  }

  @ApiBearerAuth()
  @Put()
  @Roles(UserRole.ADMIN)
  upsert(@Body() dto: UpdateSettingDto) {
    return this.settingService.upsert(dto);
  }
}
