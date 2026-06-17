import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import {
  paginationMeta,
  successResponse,
} from '../../../common/utils/api-response.util';
import { ProductRepository } from '../../products/repositories/product.repository';
import { CreateReviewDto } from '../dto/create-review.dto';
import { ReviewRepository } from '../repositories/review.repository';

@Injectable()
export class ReviewService {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async findByProduct(productId: string, query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { data, total } = await this.reviewRepository.findByProduct(
      productId,
      query,
    );
    return successResponse(
      data,
      'Reviews retrieved',
      paginationMeta(page, limit, total),
    );
  }

  async create(userId: string, dto: CreateReviewDto) {
    const product = await this.productRepository.findById(dto.productId);
    if (!product) throw new BusinessException('Product not found', 404);

    const review = await this.reviewRepository.create({
      id: randomUUID(),
      productId: dto.productId,
      userId,
      rating: dto.rating,
      comment: dto.comment,
    });
    return successResponse(review, 'Review created');
  }

  async remove(id: string) {
    const review = await this.reviewRepository.findById(id);
    if (!review) throw new BusinessException('Review not found', 404);
    await this.reviewRepository.delete(id);
    return successResponse(null, 'Review deleted');
  }

  async findAllAdmin(
    query: PaginationQueryDto & {
      status?: string;
      rating?: number;
      productSearch?: string;
    },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { data, total } = await this.reviewRepository.findAllAdmin(query);
    return successResponse(
      data,
      'Reviews retrieved',
      paginationMeta(page, limit, total),
    );
  }

  async getStats() {
    return successResponse(
      await this.reviewRepository.getStats(),
      'Review stats',
    );
  }

  async setStatus(id: string, status: 'approved' | 'rejected') {
    const review = await this.reviewRepository.findById(id);
    if (!review) throw new BusinessException('Review not found', 404);
    await this.reviewRepository.updateStatus(id, status);
    return successResponse(
      null,
      status === 'approved' ? 'Approved' : 'Rejected',
    );
  }
}
