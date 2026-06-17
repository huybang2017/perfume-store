import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/constants';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { BrandService } from '../services/brand.service';

@ApiTags('Brands')
@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Public()
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.brandService.findAll(query);
  }

  @ApiBearerAuth()
  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: { name: string; slug: string; description?: string }) {
    return this.brandService.create(dto);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  update(
    @Param('id') id: string,
    @Body() dto: Partial<{ name: string; slug: string; description?: string }>,
  ) {
    return this.brandService.update(id, dto);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.brandService.remove(id);
  }
}
