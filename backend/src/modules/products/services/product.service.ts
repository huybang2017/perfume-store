import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  isActiveFromStatus,
  ProductStatus,
} from '../../../common/constants/product-status';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { MSG } from '../../../common/i18n/messages.en';
import {
  paginationMeta,
  successResponse,
} from '../../../common/utils/api-response.util';
import { BrandRepository } from '../../brands/repositories/brand.repository';
import { CategoryRepository } from '../../categories/repositories/category.repository';
import { CreateProductDto } from '../dto/create-product.dto';
import { ProductQueryDto } from '../dto/product-query.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import {
  BulkVariantUpdateDto,
  SaveProductVariantsDto,
} from '../dto/save-product-variants.dto';
import { BulkProductDto, ProductBulkAction } from '../dto/bulk-product.dto';
import { ProductMapper } from '../mappers/product.mapper';
import {
  ProductRepository,
  ResolvedProductQuery,
} from '../repositories/product.repository';
import { VariantRepository } from '../repositories/variant.repository';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly variantRepository: VariantRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly brandRepository: BrandRepository,
  ) {}

  async findAll(query: ProductQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const resolved = await this.resolveQuery(query);

    if (
      resolved.minPrice != null &&
      resolved.maxPrice != null &&
      resolved.minPrice > resolved.maxPrice
    ) {
      throw new BusinessException('Invalid price range');
    }

    const { data, total } = await this.productRepository.findAll(resolved);
    const productIds = data.map((d) => d.product.id);
    const [optionSummaries, variantThumbnails] = await Promise.all([
      this.variantRepository.getProductListOptionSummaries(productIds),
      this.variantRepository.getFirstVariantImageByProductIds(productIds),
    ]);

    const list = data.map((row) => {
      const summary = optionSummaries[row.product.id];
      const product = { ...row.product };
      if (!product.thumbnailUrl?.trim() && variantThumbnails[product.id]) {
        product.thumbnailUrl = variantThumbnails[product.id];
      }
      return {
        ...row,
        product,
        availableColors: summary?.colors,
        availableSizes: summary?.sizes,
      };
    });

    return successResponse(
      ProductMapper.toResponseList(list),
      MSG.PRODUCTS_RETRIEVED,
      paginationMeta(page, limit, total),
    );
  }

  private async resolveQuery(
    query: ProductQueryDto,
  ): Promise<ResolvedProductQuery> {
    const resolved: ResolvedProductQuery = {
      ...query,
      search: query.search?.trim() || undefined,
      status: query.status ?? (query.all ? undefined : ProductStatus.ACTIVE),
      isActive: query.status || query.all ? query.isActive : undefined,
    };

    if (query.category) {
      const category = await this.categoryRepository.findBySlug(query.category);
      if (!category) {
        return { ...resolved, categoryId: '__none__' };
      }
      resolved.categoryId = category.id;
    }

    if (query.brand) {
      const slugs = query.brand
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const brandRows = await this.brandRepository.findBySlugs(slugs);
      resolved.brandIdList = brandRows.map((b) => b.id);
      if (slugs.length && !resolved.brandIdList.length) {
        resolved.brandIdList = ['__none__'];
      }
    } else if (query.brandIds) {
      resolved.brandIdList = query.brandIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
    }

    const optionFilters: { optionNames: string[]; values: string[] }[] = [];
    if (query.color) {
      optionFilters.push({
        optionNames: ['Màu sắc', 'Color', 'Màu'],
        values: query.color
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean),
      });
    }
    if (query.size) {
      optionFilters.push({
        optionNames: ['Size', 'Kích thước'],
        values: query.size
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean),
      });
    }

    if (optionFilters.length) {
      const ids =
        await this.variantRepository.findProductIdsByOptionValues(
          optionFilters,
        );
      if (!ids?.length) {
        resolved.productIdList = '__none__';
      } else {
        resolved.productIdList = ids;
      }
    }

    return resolved;
  }

  async getFilterOptions() {
    const options = await this.variantRepository.getShopFilterOptions();
    return successResponse(options, MSG.PRODUCTS_RETRIEVED);
  }

  async getStats() {
    const stats = await this.productRepository.getStats();
    return successResponse(stats, MSG.PRODUCTS_RETRIEVED);
  }

  async bulkAction(dto: BulkProductDto) {
    switch (dto.action) {
      case ProductBulkAction.DELETE:
        await this.productRepository.bulkDelete(dto.ids);
        break;
      case ProductBulkAction.ACTIVATE:
        await this.productRepository.bulkUpdate(dto.ids, {
          isActive: true,
          status: ProductStatus.ACTIVE,
        });
        break;
      case ProductBulkAction.DEACTIVATE:
        await this.productRepository.bulkUpdate(dto.ids, {
          isActive: false,
          status: ProductStatus.ARCHIVED,
        });
        break;
      case ProductBulkAction.SET_CATEGORY:
        if (!dto.categoryId) throw new BusinessException('Missing categoryId');
        await this.productRepository.bulkUpdate(dto.ids, {
          categoryId: dto.categoryId,
        });
        break;
      case ProductBulkAction.SET_BRAND:
        if (!dto.brandId) throw new BusinessException('Missing brandId');
        await this.productRepository.bulkUpdate(dto.ids, {
          brandId: dto.brandId,
        });
        break;
    }
    return successResponse(null, 'Bulk update completed');
  }

  async duplicate(id: string) {
    const full = await this.loadFullProduct(id);
    if (!full) throw new BusinessException(MSG.PRODUCT_NOT_FOUND, 404);
    const source = await this.productRepository.findById(id);
    if (!source) throw new BusinessException(MSG.PRODUCT_NOT_FOUND, 404);

    const newSlug = `${source.slug}-copy-${Date.now().toString(36).slice(-4)}`;
    const variantData = await this.variantRepository.loadProductVariantData(id);
    return this.create({
      name: `${source.name} (copy)`,
      slug: newSlug,
      description: source.description ?? undefined,
      price: Number(source.price),
      comparePrice: source.comparePrice
        ? Number(source.comparePrice)
        : undefined,
      sku: source.sku ? `${source.sku}-COPY` : undefined,
      images: (source.images as string[]) ?? [],
      categoryId: source.categoryId ?? undefined,
      brandId: source.brandId ?? undefined,
      stock: source.stock,
      isFeatured: false,
      options: variantData.options.map((o) => ({
        name: o.name,
        values: o.values.map((v) => v.value),
      })),
      variants: variantData.variants.map((v) => ({
        sku: `${v.sku}-COPY`,
        price: Number(v.price),
        comparePrice: v.comparePrice ? Number(v.comparePrice) : undefined,
        stock: v.stock,
        weight: v.weight ? Number(v.weight) : undefined,
        isActive: v.isActive,
        optionValues: v.options,
        imageUrl: v.imageUrl,
        imageUrls: v.imageUrls,
      })),
    });
  }

  private async loadFullProduct(productId: string) {
    const product = await this.productRepository.findById(productId);
    if (!product) return null;
    const variantData =
      await this.variantRepository.loadProductVariantData(productId);
    const agg = await this.variantRepository.getAggregates(productId);
    const allImages = [
      ...variantData.images,
      ...variantData.variants.flatMap((v) => v.imageUrls),
    ];
    const uniqueImages = [...new Set(allImages)];
    if (!uniqueImages.length) {
      uniqueImages.push(...((product.images as string[]) ?? []));
    }

    return ProductMapper.toResponse(product, {
      priceMin: agg.priceMin || Number(product.price),
      priceMax: agg.priceMax || Number(product.price),
      totalStock: agg.totalStock || product.stock,
      variants: ProductMapper.mapVariants(variantData.variants),
      options: variantData.options,
      images: uniqueImages,
    });
  }

  async findOne(id: string) {
    const full = await this.loadFullProduct(id);
    if (!full) throw new BusinessException(MSG.PRODUCT_NOT_FOUND, 404);
    return successResponse(full);
  }

  async findBySlug(slug: string) {
    const product = await this.productRepository.findBySlug(slug);
    if (!product) throw new BusinessException(MSG.PRODUCT_NOT_FOUND, 404);
    const full = await this.loadFullProduct(product.id);
    return successResponse(full!);
  }

  async create(dto: CreateProductDto) {
    const existing = await this.productRepository.findBySlug(dto.slug);
    if (existing) throw new BusinessException('Slug already exists');

    const productId = randomUUID();
    const status = dto.status ?? ProductStatus.DRAFT;
    await this.productRepository.create({
      id: productId,
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      price: String(dto.price),
      comparePrice: dto.comparePrice ? String(dto.comparePrice) : undefined,
      sku: dto.sku,
      images: dto.images ?? [],
      thumbnailUrl: dto.thumbnailUrl ?? dto.images?.[0] ?? null,
      categoryId: dto.categoryId,
      brandId: dto.brandId,
      stock: dto.stock ?? 0,
      isFeatured: dto.isFeatured ?? false,
      status,
      isActive: isActiveFromStatus(status),
    });

    if (dto.variants?.length) {
      await this.variantRepository.saveProductVariants(
        productId,
        dto.options ?? [],
        dto.variants.map((v) => ({
          sku: v.sku,
          price: v.price,
          comparePrice: v.comparePrice,
          stock: v.stock,
          weight: v.weight,
          isActive: v.isActive,
          optionValues: v.optionValues,
          imageUrl: v.imageUrl,
          imageUrls: v.imageUrls,
        })),
        dto.images ?? [],
      );
    } else {
      await this.variantRepository.createDefaultVariant(productId, {
        sku: dto.sku ?? `SKU-${dto.slug}`,
        price: dto.price,
        comparePrice: dto.comparePrice,
        stock: dto.stock ?? 0,
      });
    }

    const full = await this.loadFullProduct(productId);
    return successResponse(full, MSG.PRODUCT_CREATED);
  }

  async update(id: string, dto: UpdateProductDto) {
    const { options, variants, status, ...productFields } = dto;
    const payload: Record<string, unknown> = { ...productFields };
    if (dto.price !== undefined) payload.price = String(dto.price);
    if (dto.comparePrice !== undefined)
      payload.comparePrice = String(dto.comparePrice);
    if (dto.thumbnailUrl !== undefined) payload.thumbnailUrl = dto.thumbnailUrl;
    if (status !== undefined) {
      payload.status = status;
      payload.isActive = isActiveFromStatus(status);
    }

    const product = await this.productRepository.update(id, payload);
    if (!product) throw new BusinessException(MSG.PRODUCT_NOT_FOUND, 404);

    if (variants?.length) {
      let resolvedOptions = options;
      if (!resolvedOptions?.length) {
        const existing =
          await this.variantRepository.loadProductVariantData(id);
        resolvedOptions = existing.options.map((o) => ({
          name: o.name,
          values: o.values.map((v) => v.value),
        }));
      }

      await this.variantRepository.saveProductVariants(
        id,
        resolvedOptions ?? [],
        variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          price: v.price,
          comparePrice: v.comparePrice,
          stock: v.stock,
          weight: v.weight,
          isActive: v.isActive,
          optionValues: v.optionValues,
          imageUrl: v.imageUrl,
          imageUrls: v.imageUrls,
        })),
        dto.images ?? (product.images as string[]) ?? [],
      );
    }

    const full = await this.loadFullProduct(id);
    return successResponse(full, MSG.PRODUCT_UPDATED);
  }

  async saveVariants(id: string, dto: SaveProductVariantsDto) {
    const product = await this.productRepository.findById(id);
    if (!product) throw new BusinessException(MSG.PRODUCT_NOT_FOUND, 404);

    await this.variantRepository.saveProductVariants(
      id,
      dto.options ?? [],
      dto.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        price: v.price,
        comparePrice: v.comparePrice,
        stock: v.stock,
        weight: v.weight,
        isActive: v.isActive,
        optionValues: v.optionValues,
        imageUrl: v.imageUrl,
        imageUrls: v.imageUrls,
      })),
      (product.images as string[]) ?? [],
    );

    const full = await this.loadFullProduct(id);
    return successResponse(full, 'Product variants saved');
  }

  async bulkUpdateVariants(dto: BulkVariantUpdateDto) {
    await this.variantRepository.bulkUpdate(dto.variantIds, {
      price: dto.price,
      comparePrice: dto.comparePrice,
      stock: dto.stock,
      isActive: dto.isActive,
    });
    return successResponse(null, 'Bulk update completed');
  }

  generateVariantCombinations(
    options: { name: string; values: string[] }[],
    baseSku: string,
    basePrice: number,
    baseStock = 0,
  ) {
    if (!options.length) return [];

    const combos: Record<string, string>[] = [{}];
    for (const opt of options) {
      const next: Record<string, string>[] = [];
      for (const combo of combos) {
        for (const val of opt.values) {
          next.push({ ...combo, [opt.name]: val });
        }
      }
      combos.length = 0;
      combos.push(...next);
    }

    return combos.map((optionValues, i) => {
      const suffix = Object.values(optionValues)
        .map((v) =>
          v
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '')
            .toUpperCase()
            .slice(0, 6),
        )
        .join('-');
      return {
        sku: `${baseSku}-${suffix || i + 1}`,
        price: basePrice,
        stock: baseStock,
        isActive: true,
        optionValues,
        imageUrl: null,
        imageUrls: [] as string[],
      };
    });
  }

  async remove(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) throw new BusinessException(MSG.PRODUCT_NOT_FOUND, 404);
    await this.productRepository.delete(id);
    return successResponse(null, MSG.PRODUCT_DELETED);
  }
}
