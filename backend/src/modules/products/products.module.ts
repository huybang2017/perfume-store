import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { BrandsModule } from '../brands/brands.module';
import { ProductController } from './controllers/product.controller';
import { ProductRepository } from './repositories/product.repository';
import { VariantRepository } from './repositories/variant.repository';
import { ProductService } from './services/product.service';

@Module({
  imports: [CategoriesModule, BrandsModule],
  controllers: [ProductController],
  providers: [ProductService, ProductRepository, VariantRepository],
  exports: [ProductService, ProductRepository, VariantRepository],
})
export class ProductsModule {}
