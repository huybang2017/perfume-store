import { Injectable, Inject } from '@nestjs/common';
import { and, asc, desc, eq, inArray, lte, sql, like, or } from 'drizzle-orm';
import { DRIZZLE } from '../../../common/constants';
import { createDrizzleClient } from '../../../database';
import { products } from '../../../database/schema/products';
import { productVariants } from '../../../database/schema/product-variants';
import { BusinessException } from '../../../common/exceptions/business.exception';
import {
  paginationMeta,
  successResponse,
} from '../../../common/utils/api-response.util';
import { ProductRepository } from '../../products/repositories/product.repository';
import { VariantRepository } from '../../products/repositories/variant.repository';
import { ProductMapper } from '../../products/mappers/product.mapper';
import { UpdateStockDto } from '../dto/update-stock.dto';
import {
  InventoryQueryDto,
  InventorySortOption,
  InventoryStockFilter,
} from '../dto/inventory-query.dto';

type DrizzleDB = ReturnType<typeof createDrizzleClient>;

const LOW_STOCK_THRESHOLD = 10;

@Injectable()
export class InventoryService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly productRepository: ProductRepository,
    private readonly variantRepository: VariantRepository,
  ) {}

  async getStats() {
    const [totalRow, lowRow, outRow] = await Promise.all([
      this.db
        .select({
          total: sql<number>`coalesce(sum(${productVariants.stock}), 0)`,
        })
        .from(productVariants)
        .innerJoin(products, eq(productVariants.productId, products.id))
        .where(
          and(eq(productVariants.isActive, true), eq(products.isActive, true)),
        ),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(productVariants)
        .innerJoin(products, eq(productVariants.productId, products.id))
        .where(
          and(
            eq(productVariants.isActive, true),
            eq(products.isActive, true),
            lte(productVariants.stock, LOW_STOCK_THRESHOLD),
            sql`${productVariants.stock} > 0`,
          ),
        ),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(productVariants)
        .innerJoin(products, eq(productVariants.productId, products.id))
        .where(
          and(
            eq(productVariants.isActive, true),
            eq(products.isActive, true),
            eq(productVariants.stock, 0),
          ),
        ),
    ]);

    return successResponse({
      totalStock: Number(totalRow[0]?.total ?? 0),
      lowStockItems: Number(lowRow[0]?.count ?? 0),
      outOfStockItems: Number(outRow[0]?.count ?? 0),
    });
  }

  async getFilterOptions() {
    const options = await this.variantRepository.getShopFilterOptions();
    return successResponse(options, 'Variant filter options');
  }

  async findAll(query: InventoryQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;
    const search = query.search?.trim();

    const colorIds = query.color
      ? await this.variantRepository.findVariantIdsByOptionValue(
          ['Màu sắc', 'Color', 'Màu'],
          query.color,
        )
      : null;
    const sizeIds = query.size
      ? await this.variantRepository.findVariantIdsByOptionValue(
          ['Size', 'Kích thước', 'Kích cỡ'],
          query.size,
        )
      : null;

    if (colorIds && !colorIds.length) {
      return successResponse(
        [],
        'Inventory list',
        paginationMeta(page, limit, 0),
      );
    }
    if (sizeIds && !sizeIds.length) {
      return successResponse(
        [],
        'Inventory list',
        paginationMeta(page, limit, 0),
      );
    }

    let variantIdFilter: string[] | undefined;
    if (colorIds && sizeIds) {
      const sizeSet = new Set(sizeIds);
      variantIdFilter = colorIds.filter((id) => sizeSet.has(id));
      if (!variantIdFilter.length) {
        return successResponse(
          [],
          'Inventory list',
          paginationMeta(page, limit, 0),
        );
      }
    } else if (colorIds) {
      variantIdFilter = colorIds;
    } else if (sizeIds) {
      variantIdFilter = sizeIds;
    }

    const stockFilter = query.stockFilter ?? InventoryStockFilter.ALL;
    const stockConditions = [
      query.variantStatus === 'active'
        ? eq(productVariants.isActive, true)
        : query.variantStatus === 'inactive'
          ? eq(productVariants.isActive, false)
          : undefined,
      query.productId ? eq(products.id, query.productId) : undefined,
      stockFilter === InventoryStockFilter.LOW
        ? and(
            lte(productVariants.stock, LOW_STOCK_THRESHOLD),
            sql`${productVariants.stock} > 0`,
          )
        : undefined,
      stockFilter === InventoryStockFilter.OUT
        ? eq(productVariants.stock, 0)
        : undefined,
      query.categoryId ? eq(products.categoryId, query.categoryId) : undefined,
      query.brandId ? eq(products.brandId, query.brandId) : undefined,
      search
        ? or(
            like(productVariants.sku, `%${search}%`),
            like(products.name, `%${search}%`),
            like(products.sku, `%${search}%`),
          )
        : undefined,
      variantIdFilter
        ? inArray(productVariants.id, variantIdFilter)
        : undefined,
    ].filter(Boolean);

    const whereClause = stockConditions.length
      ? and(...stockConditions)
      : undefined;

    const sort = query.sort ?? InventorySortOption.STOCK_ASC;
    const orderBy =
      sort === InventorySortOption.STOCK_DESC
        ? desc(productVariants.stock)
        : sort === InventorySortOption.NAME_ASC
          ? asc(products.name)
          : sort === InventorySortOption.NAME_DESC
            ? desc(products.name)
            : asc(productVariants.stock);

    const [rows, countResult] = await Promise.all([
      this.db
        .select({
          product: products,
          variantId: productVariants.id,
          variantSku: productVariants.sku,
          variantStock: productVariants.stock,
          variantPrice: productVariants.price,
          variantComparePrice: productVariants.comparePrice,
          variantImageUrl: productVariants.imageUrl,
          variantIsActive: productVariants.isActive,
          variantUpdatedAt: productVariants.updatedAt,
        })
        .from(productVariants)
        .innerJoin(products, eq(productVariants.productId, products.id))
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(productVariants)
        .innerJoin(products, eq(productVariants.productId, products.id))
        .where(whereClause),
    ]);

    const variantIds = rows.map((r) => r.variantId);
    const optionsMap =
      await this.variantRepository.getVariantOptionsMap(variantIds);

    const mapped = rows.map((row) => ({
      ...ProductMapper.toResponse(row.product, {
        totalStock: row.variantStock,
      }),
      variantId: row.variantId,
      variantSku: row.variantSku,
      variantStock: row.variantStock,
      variantPrice: Number(row.variantPrice),
      variantComparePrice: row.variantComparePrice
        ? Number(row.variantComparePrice)
        : undefined,
      variantOptions: optionsMap[row.variantId] ?? {},
      variantImageUrl: row.variantImageUrl ?? null,
      variantIsActive: row.variantIsActive,
      variantUpdatedAt: row.variantUpdatedAt,
      thumbnailUrl: ProductMapper.resolveThumbnail(
        row.product,
        [
          {
            id: row.variantId,
            sku: row.variantSku,
            price: Number(row.variantPrice),
            comparePrice: row.variantComparePrice
              ? Number(row.variantComparePrice)
              : null,
            stock: row.variantStock,
            weight: null,
            isActive: row.variantIsActive,
            options: optionsMap[row.variantId] ?? {},
            imageUrl: row.variantImageUrl ?? null,
            imageUrls: row.variantImageUrl ? [row.variantImageUrl] : [],
          },
        ],
      ),
    }));

    return successResponse(
      mapped,
      'Inventory list',
      paginationMeta(page, limit, Number(countResult[0]?.count ?? 0)),
    );
  }

  async findLowStock(query: InventoryQueryDto) {
    return this.findAll({
      ...query,
      stockFilter: InventoryStockFilter.LOW,
      limit: query.limit ?? 10,
    });
  }

  async updateStock(productId: string, dto: UpdateStockDto) {
    const defaultVariant =
      await this.variantRepository.findDefaultByProductId(productId);
    if (defaultVariant) {
      await this.variantRepository.bulkUpdate([defaultVariant.id], {
        stock: dto.stock,
      });
    } else {
      await this.productRepository.update(productId, { stock: dto.stock });
    }

    const product = await this.productRepository.findById(productId);
    if (!product) throw new BusinessException('Product not found', 404);
    const full = await this.productRepository.findById(productId);
    return successResponse(
      ProductMapper.toResponse(full!),
      'Stock updated',
    );
  }
}
