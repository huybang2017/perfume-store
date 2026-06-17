import { Module } from '@nestjs/common';
import { BrandController } from './controllers/brand.controller';
import { BrandRepository } from './repositories/brand.repository';
import { BrandService } from './services/brand.service';

@Module({
  controllers: [BrandController],
  providers: [BrandService, BrandRepository],
  exports: [BrandService, BrandRepository],
})
export class BrandsModule {}
