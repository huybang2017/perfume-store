import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsEnum, IsUUID } from 'class-validator';

export enum OrderBulkAction {
  CONFIRM = 'confirm',
  CANCEL = 'cancel',
}

export class BulkOrderDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  ids!: string[];

  @ApiProperty({ enum: OrderBulkAction })
  @IsEnum(OrderBulkAction)
  action!: OrderBulkAction;
}
