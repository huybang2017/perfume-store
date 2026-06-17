import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray, like, or, sql } from 'drizzle-orm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import {
  products,
  Product,
  NewProduct,
} from '../../../database/schema/products';
import { productVariants } from '../../../database/schema/product-variants';
import { orderItems, orders } from '../../../database/schema/orders';
import { ProductQueryDto, ProductSortOption } from '../dto/product-query.dto';

export interface ResolvedProductQuery extends ProductQueryDto {
  categoryId?: string;
  brandIdList?: string[];
  productIdList?: string[] | '__none__';
}

@Injectable()
export class ProductRepository extends BaseRepository {
  async findById(id: string): Promise<Product | undefined> {
    const [product] = await this.db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    return product;
  }

  async findBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await this.db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);
    return product;
  }

  async create(data: NewProduct): Promise<Product> {
    await this.db.insert(products).values(data);
    return (await this.findById(data.id))!;
  }

  async update(
    id: string,
    data: Partial<NewProduct>,
  ): Promise<Product | undefined> {
    await this.db.update(products).set(data).where(eq(products.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(products).where(eq(products.id, id));
  }

  /** @deprecated Use VariantRepository.decrementStock */
  async decrementStock(
    id: string,
    quantity: number,
  ): Promise<Product | undefined> {
    const product = await this.findById(id);
    if (!product || product.stock < quantity) return undefined;
    await this.db
      .update(products)
      .set({ stock: product.stock - quantity })
      .where(eq(products.id, id));
    return this.findById(id);
  }

  /** @deprecated Use VariantRepository.restoreStock */
  async restoreStock(id: string, quantity: number): Promise<void> {
    const product = await this.findById(id);
    if (!product) return;
    await this.db
      .update(products)
      .set({ stock: product.stock + quantity })
      .where(eq(products.id, id));
  }

  private variantAggSubquery() {
    return this.db
      .select({
        productId: productVariants.productId,
        priceMin: sql<string>`MIN(${productVariants.price})`.as('price_min'),
        priceMax: sql<string>`MAX(${productVariants.price})`.as('price_max'),
        totalStock: sql<number>`COALESCE(SUM(${productVariants.stock}), 0)`.as(
          'total_stock',
        ),
      })
      .from(productVariants)
      .where(eq(productVariants.isActive, true))
      .groupBy(productVariants.productId)
      .as('variant_agg');
  }

  async findAll(query: ResolvedProductQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const offset = (page - 1) * limit;

    const agg = this.variantAggSubquery();

    const filters = [
      query.categoryId === '__none__'
        ? sql`1 = 0`
        : query.categoryId
          ? eq(products.categoryId, query.categoryId)
          : undefined,
      query.brandIdList?.includes('__none__')
        ? sql`1 = 0`
        : query.brandIdList?.length
          ? inArray(products.brandId, query.brandIdList)
          : undefined,
      query.productIdList === '__none__'
        ? sql`1 = 0`
        : Array.isArray(query.productIdList) && query.productIdList.length
          ? inArray(products.id, query.productIdList)
          : undefined,
      query.isFeatured !== undefined
        ? eq(products.isFeatured, query.isFeatured)
        : undefined,
      query.status
        ? eq(products.status, query.status)
        : query.isActive !== undefined
          ? eq(products.isActive, query.isActive)
          : undefined,
      query.inStock === true
        ? sql`COALESCE(${agg.totalStock}, ${products.stock}) > 0`
        : undefined,
      query.inStock === false
        ? sql`COALESCE(${agg.totalStock}, ${products.stock}) <= 0`
        : undefined,
      query.minPrice !== undefined
        ? sql`COALESCE(${agg.priceMin}, ${products.price}) >= ${String(query.minPrice)}`
        : undefined,
      query.maxPrice !== undefined
        ? sql`COALESCE(${agg.priceMax}, ${products.price}) <= ${String(query.maxPrice)}`
        : undefined,
      query.search
        ? or(
            like(products.name, `%${query.search}%`),
            like(products.sku, `%${query.search}%`),
          )
        : undefined,
    ].filter(Boolean);

    const whereClause = filters.length ? and(...filters) : undefined;
    const sort = query.sort ?? ProductSortOption.NEWEST;

    if (sort === ProductSortOption.BEST_SELLING) {
      return this.findAllByBestSelling(whereClause, page, limit, offset);
    }

    const orderings = this.buildOrderings(sort);

    const [rows, countResult] = await Promise.all([
      this.db
        .select({
          product: products,
          priceMin: agg.priceMin,
          priceMax: agg.priceMax,
          totalStock: agg.totalStock,
        })
        .from(products)
        .leftJoin(agg, eq(products.id, agg.productId))
        .where(whereClause)
        .orderBy(...orderings)
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .leftJoin(agg, eq(products.id, agg.productId))
        .where(whereClause),
    ]);

    return {
      data: rows.map((r) => ({
        product: r.product,
        priceMin: Number(r.priceMin ?? r.product.price),
        priceMax: Number(r.priceMax ?? r.product.price),
        totalStock: Number(r.totalStock ?? r.product.stock),
      })),
      total: Number(countResult[0]?.count ?? 0),
    };
  }

  private buildOrderings(sort: ProductSortOption) {
    switch (sort) {
      case ProductSortOption.OLDEST:
        return [asc(products.createdAt)];
      case ProductSortOption.NAME_ASC:
        return [asc(products.name)];
      case ProductSortOption.NAME_DESC:
        return [desc(products.name)];
      case ProductSortOption.PRICE_ASC:
        return [asc(products.price)];
      case ProductSortOption.PRICE_DESC:
        return [desc(products.price)];
      case ProductSortOption.FEATURED:
        return [desc(products.isFeatured), desc(products.createdAt)];
      case ProductSortOption.NEWEST:
      default:
        return [desc(products.createdAt)];
    }
  }

  async getStats() {
    const agg = this.variantAggSubquery();
    const [row] = await this.db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`sum(case when ${products.isActive} = 1 then 1 else 0 end)`,
        featured: sql<number>`sum(case when ${products.isFeatured} = 1 then 1 else 0 end)`,
        outOfStock: sql<number>`sum(case when COALESCE(${agg.totalStock}, ${products.stock}) <= 0 then 1 else 0 end)`,
      })
      .from(products)
      .leftJoin(agg, eq(products.id, agg.productId));
    return {
      total: Number(row?.total ?? 0),
      active: Number(row?.active ?? 0),
      featured: Number(row?.featured ?? 0),
      outOfStock: Number(row?.outOfStock ?? 0),
    };
  }

  async bulkUpdate(
    ids: string[],
    data: Partial<
      Pick<NewProduct, 'isActive' | 'status' | 'categoryId' | 'brandId'>
    >,
  ) {
    if (!ids.length) return;
    await this.db.update(products).set(data).where(inArray(products.id, ids));
  }

  async bulkDelete(ids: string[]) {
    if (!ids.length) return;
    await this.db.delete(products).where(inArray(products.id, ids));
  }

  private async findAllByBestSelling(
    whereClause: ReturnType<typeof and> | undefined,
    page: number,
    limit: number,
    offset: number,
  ) {
    const salesSubquery = this.db
      .select({
        productId: orderItems.productId,
        totalSold: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`.as(
          'total_sold',
        ),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(sql`${orders.status} != 'cancelled'`)
      .groupBy(orderItems.productId)
      .as('sales');

    const baseQuery = this.db
      .select({
        product: products,
        totalSold: sql<number>`COALESCE(${salesSubquery.totalSold}, 0)`.as(
          'total_sold',
        ),
      })
      .from(products)
      .leftJoin(salesSubquery, eq(products.id, salesSubquery.productId))
      .where(whereClause)
      .orderBy(
        desc(sql`COALESCE(${salesSubquery.totalSold}, 0)`),
        desc(products.createdAt),
      );

    const [rows, countResult] = await Promise.all([
      baseQuery.limit(limit).offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(whereClause),
    ]);

    const productIds = rows.map((r) => r.product.id);
    const aggRows =
      productIds.length > 0
        ? await this.db
            .select({
              productId: productVariants.productId,
              priceMin: sql<string>`MIN(${productVariants.price})`,
              priceMax: sql<string>`MAX(${productVariants.price})`,
              totalStock: sql<number>`COALESCE(SUM(${productVariants.stock}), 0)`,
            })
            .from(productVariants)
            .where(
              and(
                inArray(productVariants.productId, productIds),
                eq(productVariants.isActive, true),
              ),
            )
            .groupBy(productVariants.productId)
        : [];

    const aggMap = Object.fromEntries(
      aggRows.map((a) => [
        a.productId,
        {
          priceMin: Number(a.priceMin),
          priceMax: Number(a.priceMax),
          totalStock: Number(a.totalStock),
        },
      ]),
    );

    return {
      data: rows.map((r) => {
        const a = aggMap[r.product.id];
        return {
          product: r.product,
          priceMin: a?.priceMin ?? Number(r.product.price),
          priceMax: a?.priceMax ?? Number(r.product.price),
          totalStock: a?.totalStock ?? r.product.stock,
        };
      }),
      total: Number(countResult[0]?.count ?? 0),
    };
  }
}
