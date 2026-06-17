import { Module } from '@nestjs/common';
import { VoucherController } from './controllers/voucher.controller';
import { VoucherRepository } from './repositories/voucher.repository';
import { VoucherService } from './services/voucher.service';

@Module({
  controllers: [VoucherController],
  providers: [VoucherService, VoucherRepository],
  exports: [VoucherService, VoucherRepository],
})
export class VouchersModule {}
