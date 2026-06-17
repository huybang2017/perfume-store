import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/constants';
import { CreateVoucherDto } from '../dto/create-voucher.dto';
import { UpdateVoucherDto } from '../dto/update-voucher.dto';
import { ValidateVoucherDto } from '../dto/validate-voucher.dto';
import { VoucherQueryDto } from '../dto/voucher-query.dto';
import { VoucherService } from '../services/voucher.service';

@ApiTags('Vouchers')
@Controller('vouchers')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Public()
  @Post('validate')
  validate(@Body() dto: ValidateVoucherDto) {
    return this.voucherService.validate(dto);
  }

  @ApiBearerAuth()
  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  getStats() {
    return this.voucherService.getStats();
  }

  @ApiBearerAuth()
  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findAll(@Query() query: VoucherQueryDto) {
    return this.voucherService.findAll(query);
  }

  @ApiBearerAuth()
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findOne(@Param('id') id: string) {
    return this.voucherService.findOne(id);
  }

  @ApiBearerAuth()
  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateVoucherDto) {
    return this.voucherService.create(dto);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateVoucherDto) {
    return this.voucherService.update(id, dto);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.voucherService.remove(id);
  }
}
