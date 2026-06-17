import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/constants';
import { InventoryQueryDto } from '../dto/inventory-query.dto';
import { UpdateStockDto } from '../dto/update-stock.dto';
import { InventoryService } from '../services/inventory.service';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory')
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('stats')
  getStats() {
    return this.inventoryService.getStats();
  }

  @Get('filter-options')
  getFilterOptions() {
    return this.inventoryService.getFilterOptions();
  }

  @Get('low-stock')
  findLowStock(@Query() query: InventoryQueryDto) {
    return this.inventoryService.findLowStock(query);
  }

  @Get()
  findAll(@Query() query: InventoryQueryDto) {
    return this.inventoryService.findAll(query);
  }

  @Patch(':productId/stock')
  updateStock(
    @Param('productId') productId: string,
    @Body() dto: UpdateStockDto,
  ) {
    return this.inventoryService.updateStock(productId, dto);
  }
}
