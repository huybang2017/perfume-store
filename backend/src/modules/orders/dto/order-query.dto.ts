import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { OrderStatus } from '../../../common/constants';

export enum OrderSortOption {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  TOTAL_ASC = 'total_asc',
  TOTAL_DESC = 'total_desc',
}

export class OrderQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Search order number or product name' })
  @IsOptional()
  @IsString()
  productSearch?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: OrderSortOption })
  @IsOptional()
  @IsEnum(OrderSortOption)
  sort?: OrderSortOption;
}
