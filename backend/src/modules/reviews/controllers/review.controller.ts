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
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/constants';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CreateReviewDto } from '../dto/create-review.dto';
import { ReviewService } from '../services/review.service';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Public()
  @Get('product/:productId')
  findByProduct(
    @Param('productId') productId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.reviewService.findByProduct(productId, query);
  }

  @ApiBearerAuth()
  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateReviewDto) {
    return this.reviewService.create(userId, dto);
  }

  @ApiBearerAuth()
  @Get('admin/list')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findAllAdmin(
    @Query()
    query: PaginationQueryDto & {
      status?: string;
      rating?: number;
      productSearch?: string;
    },
  ) {
    return this.reviewService.findAllAdmin(query);
  }

  @ApiBearerAuth()
  @Get('admin/stats')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  getStats() {
    return this.reviewService.getStats();
  }

  @ApiBearerAuth()
  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  setStatus(
    @Param('id') id: string,
    @Body() body: { status: 'approved' | 'rejected' },
  ) {
    return this.reviewService.setStatus(id, body.status);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  remove(@Param('id') id: string) {
    return this.reviewService.remove(id);
  }
}
