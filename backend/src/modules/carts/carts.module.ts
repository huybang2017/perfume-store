import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { CartController } from './controllers/cart.controller';
import { CartRepository } from './repositories/cart.repository';
import { CartService } from './services/cart.service';

@Module({
  imports: [ProductsModule],
  controllers: [CartController],
  providers: [CartService, CartRepository],
  exports: [CartService, CartRepository],
})
export class CartsModule {}
