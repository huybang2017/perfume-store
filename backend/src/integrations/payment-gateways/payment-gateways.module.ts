import { Module } from '@nestjs/common';
import { VnpayGateway } from './vnpay.gateway';
import { MomoGateway } from './momo.gateway';

@Module({
  providers: [VnpayGateway, MomoGateway],
  exports: [VnpayGateway, MomoGateway],
})
export class PaymentGatewaysModule {}
