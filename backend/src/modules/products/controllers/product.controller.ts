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
import { CreateProductDto } from '../dto/create-product.dto';
import { ProductQueryDto } from '../dto/product-query.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import {
  BulkVariantUpdateDto,
  SaveProductVariantsDto,
} from '../dto/save-product-variants.dto';
import { BulkProductDto } from '../dto/bulk-product.dto';
import { ProductService } from '../services/product.service';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Public()
  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.productService.findAll(query);
  }

  @Public()
  @Get('filter-options')
  getFilterOptions() {
    return this.productService.getFilterOptions();
  }

  @ApiBearerAuth()
  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  getStats() {
    return this.productService.getStats();
  }

  @ApiBearerAuth()
  @Patch('bulk')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  bulkProducts(@Body() dto: BulkProductDto) {
    return this.productService.bulkAction(dto);
  }

  @Public()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productService.findBySlug(slug);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @ApiBearerAuth()
  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @ApiBearerAuth()
  @Patch('variants/bulk')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  bulkVariants(@Body() dto: BulkVariantUpdateDto) {
    return this.productService.bulkUpdateVariants(dto);
  }

  @ApiBearerAuth()
  @Post(':id/variants')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  saveVariants(@Param('id') id: string, @Body() dto: SaveProductVariantsDto) {
    return this.productService.saveVariants(id, dto);
  }

  @ApiBearerAuth()
  @Post(':id/variants/generate')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  generateVariants(
    @Param('id') id: string,
    @Body()
    body: {
      options: { name: string; values: string[] }[];
      baseSku: string;
      basePrice: number;
      baseStock?: number;
    },
  ) {
    const variants = this.productService.generateVariantCombinations(
      body.options,
      body.baseSku,
      body.basePrice,
      body.baseStock,
    );
    return { success: true, data: variants };
  }

  @ApiBearerAuth()
  @Post(':id/duplicate')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  duplicate(@Param('id') id: string) {
    return this.productService.duplicate(id);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
