import { Module } from '@nestjs/common';
import { PaymentGatewaysModule } from '../../integrations/payment-gateways/payment-gateways.module';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { PaymentController } from './controllers/payment.controller';
import { PaymentRepository } from './repositories/payment.repository';
import { PaymentService } from './services/payment.service';

@Module({
  imports: [OrdersModule, ProductsModule, PaymentGatewaysModule],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository],
  exports: [PaymentService, PaymentRepository],
})
export class PaymentsModule {}
