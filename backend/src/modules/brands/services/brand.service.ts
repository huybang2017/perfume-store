import { Injectable } from '@nestjs/common';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { randomUUID } from 'crypto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import {
  paginationMeta,
  successResponse,
} from '../../../common/utils/api-response.util';
import { BrandRepository } from '../repositories/brand.repository';

@Injectable()
export class BrandService {
  constructor(private readonly brandRepository: BrandRepository) {}

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { data, total } = await this.brandRepository.findAll(query);
    return successResponse(
      data,
      'Brands retrieved',
      paginationMeta(page, limit, total),
    );
  }

  async create(dto: {
    name: string;
    slug: string;
    description?: string;
    logo?: string;
  }) {
    const brand = await this.brandRepository.create({
      id: randomUUID(),
      ...dto,
    });
    return successResponse(brand, 'Brand created');
  }

  async update(
    id: string,
    dto: Partial<{ name: string; slug: string; description?: string }>,
  ) {
    const brand = await this.brandRepository.update(id, dto);
    if (!brand) throw new BusinessException('Không tìm thấy thương hiệu', 404);
    return successResponse(brand, 'Brand updated');
  }

  async remove(id: string) {
    await this.brandRepository.delete(id);
    return successResponse(null, 'Brand deleted');
  }
}
