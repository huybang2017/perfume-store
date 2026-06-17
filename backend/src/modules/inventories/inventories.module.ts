import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { InventoryController } from './controllers/inventory.controller';
import { InventoryService } from './services/inventory.service';

@Module({
  imports: [ProductsModule],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoriesModule {}
