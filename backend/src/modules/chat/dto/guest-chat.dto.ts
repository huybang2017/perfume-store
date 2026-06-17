import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class GuestIdDto {
  @ApiProperty({ description: 'UUID khách lưu trong localStorage' })
  @IsString()
  guestId: string;
}

export class GuestSendMessageDto extends GuestIdDto {
  @ApiProperty()
  @IsString()
  conversationId: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  content: string;
}
