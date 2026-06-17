import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class MakeAdminDto {
  @ApiProperty({ example: 'you@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Must match ADMIN_SETUP_SECRET on the server' })
  @IsString()
  @MinLength(8)
  secret: string;

  @ApiPropertyOptional({
    description: 'Required when the email is not registered yet',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({
    description: 'Required when the email is not registered yet',
  })
  @IsOptional()
  @IsString()
  fullName?: string;
}
