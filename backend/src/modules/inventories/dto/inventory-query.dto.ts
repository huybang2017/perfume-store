import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export enum InventoryStockFilter {
  ALL = 'all',
  LOW = 'low',
  OUT = 'out',
}

export enum InventorySortOption {
  STOCK_ASC = 'stock_asc',
  STOCK_DESC = 'stock_desc',
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
}

export class InventoryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: InventoryStockFilter })
  @IsOptional()
  @IsEnum(InventoryStockFilter)
  stockFilter?: InventoryStockFilter;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional({ enum: InventorySortOption })
  @IsOptional()
  @IsEnum(InventorySortOption)
  sort?: InventorySortOption;

  @ApiPropertyOptional({ description: 'Lọc theo giá trị màu (Màu sắc)' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Lọc theo giá trị size' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ description: 'Lọc theo sản phẩm (product id)' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({
    description: 'Lọc trạng thái biến thể: active | inactive',
  })
  @IsOptional()
  @IsString()
  variantStatus?: 'active' | 'inactive';
}
