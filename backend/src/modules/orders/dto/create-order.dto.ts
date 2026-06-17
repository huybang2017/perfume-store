import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    example: {
      fullName: 'John',
      phone: '0901234567',
      address: '123 St',
      city: 'HCM',
    },
  })
  @IsObject()
  shippingAddress: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  voucherCode?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingFee?: number;
}
