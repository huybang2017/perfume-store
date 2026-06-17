import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import {
  paginationMeta,
  successResponse,
} from '../../../common/utils/api-response.util';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryRepository } from '../repositories/category.repository';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { data, total } = await this.categoryRepository.findAll(query);
    return successResponse(
      data,
      'Categories retrieved',
      paginationMeta(page, limit, total),
    );
  }

  async findOne(id: string) {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new BusinessException('Category not found', 404);
    return successResponse(category);
  }

  async create(dto: CreateCategoryDto) {
    const category = await this.categoryRepository.create({
      id: randomUUID(),
      ...dto,
    });
    return successResponse(category, 'Category created');
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.categoryRepository.update(id, dto);
    if (!category) throw new BusinessException('Category not found', 404);
    return successResponse(category, 'Category updated');
  }

  async remove(id: string) {
    await this.categoryRepository.delete(id);
    return successResponse(null, 'Category deleted');
  }
}
