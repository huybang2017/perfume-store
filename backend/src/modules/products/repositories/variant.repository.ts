import { Injectable } from '@nestjs/common';
import { and, asc, eq, gte, inArray, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { BaseRepository } from '../../../common/repositories/base.repository';
import {
  deriveOptionInputs,
  resolveOptionValueId,
  SIZE_OPTION_NAMES,
  COLOR_OPTION_NAMES,
} from '../utils/variant-options.util';
import { pickFirstVariantImage } from '../utils/product-thumbnail.util';
import {
  productVariants,
  productOptions,
  productOptionValues,
  variantOptionValues,
  productImages,
  ProductVariant,
  NewProductVariant,
} from '../../../database/schema/product-variants';
import { products } from '../../../database/schema/products';

export interface VariantOptionInput {
  name: string;
  values: string[];
}

export interface VariantInput {
  id?: string;
  sku: string;
  price: number;
  comparePrice?: number;
  stock: number;
  weight?: number;
  isActive?: boolean;
  optionValues: Record<string, string>;
  imageUrl?: string | null;
  imageUrls?: string[];
}

export interface VariantDetail extends ProductVariant {
  options: Record<string, string>;
  imageUrl: string | null;
  imageUrls: string[];
}

function resolveVariantImageInput(v: VariantInput): {
  imageUrl: string | null;
  extraImageUrls: string[];
} {
  const primary = (v.imageUrl ?? v.imageUrls?.[0] ?? '').trim() || null;
  const extra = (v.imageUrls ?? []).filter(
    (url) => url.trim() && url.trim() !== primary,
  );
  return { imageUrl: primary, extraImageUrls: extra };
}

function buildVariantImageList(
  imageUrl: string | null | undefined,
  variantImages: { imageUrl: string }[],
): { imageUrl: string | null; imageUrls: string[] } {
  const fromTable = variantImages.map((img) => img.imageUrl);
  const primary = imageUrl ?? fromTable[0] ?? null;
  if (!primary) {
    return { imageUrl: null, imageUrls: fromTable };
  }
  const imageUrls = [
    primary,
    ...fromTable.filter((url) => url !== primary),
  ];
  return { imageUrl: primary, imageUrls };
}

@Injectable()
export class VariantRepository extends BaseRepository {
  async findById(id: string): Promise<ProductVariant | undefined> {
    const [row] = await this.db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, id))
      .limit(1);
    return row;
  }

  async findByProductId(productId: string): Promise<ProductVariant[]> {
    return this.db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId))
      .orderBy(asc(productVariants.createdAt));
  }

  async findDefaultByProductId(
    productId: string,
  ): Promise<ProductVariant | undefined> {
    const [row] = await this.db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId))
      .orderBy(asc(productVariants.createdAt))
      .limit(1);
    return row;
  }

  async getVariantOptionsMap(
    variantIds: string[],
  ): Promise<Record<string, Record<string, string>>> {
    if (!variantIds.length) return {};

    const rows = await this.db
      .select({
        variantId: variantOptionValues.variantId,
        optionName: productOptions.name,
        value: productOptionValues.value,
      })
      .from(variantOptionValues)
      .innerJoin(
        productOptionValues,
        eq(variantOptionValues.optionValueId, productOptionValues.id),
      )
      .innerJoin(
        productOptions,
        eq(productOptionValues.optionId, productOptions.id),
      )
      .where(inArray(variantOptionValues.variantId, variantIds));

    const map: Record<string, Record<string, string>> = {};
    for (const r of rows) {
      if (!map[r.variantId]) map[r.variantId] = {};
      map[r.variantId][r.optionName] = r.value;
    }
    return map;
  }

  async loadProductVariantData(productId: string) {
    const [variants, options, images] = await Promise.all([
      this.findByProductId(productId),
      this.db
        .select()
        .from(productOptions)
        .where(eq(productOptions.productId, productId))
        .orderBy(asc(productOptions.sortOrder)),
      this.db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, productId))
        .orderBy(asc(productImages.sortOrder)),
    ]);

    const optionIds = options.map((o) => o.id);
    const optionValues = optionIds.length
      ? await this.db
          .select()
          .from(productOptionValues)
          .where(inArray(productOptionValues.optionId, optionIds))
          .orderBy(asc(productOptionValues.sortOrder))
      : [];

    const variantIds = variants.map((v) => v.id);
    const optionsMap = await this.getVariantOptionsMap(variantIds);

    const variantsWithMeta = variants.map((v) => {
      const variantImages = images.filter((img) => img.variantId === v.id);
      const { imageUrl, imageUrls } = buildVariantImageList(
        v.imageUrl,
        variantImages,
      );
      return {
        ...v,
        options: optionsMap[v.id] ?? {},
        imageUrl,
        imageUrls,
      };
    });

    const productLevelImages = images
      .filter((img) => !img.variantId)
      .map((img) => img.imageUrl);

    return {
      variants: variantsWithMeta,
      options: options.map((o) => ({
        id: o.id,
        name: o.name,
        sortOrder: o.sortOrder,
        values: optionValues
          .filter((v) => v.optionId === o.id)
          .map((v) => ({ id: v.id, value: v.value, sortOrder: v.sortOrder })),
      })),
      images: productLevelImages,
    };
  }

  async getAggregates(productId: string) {
    const [row] = await this.db
      .select({
        priceMin: sql<number>`MIN(CAST(${productVariants.price} AS DECIMAL(12,2)))`,
        priceMax: sql<number>`MAX(CAST(${productVariants.price} AS DECIMAL(12,2)))`,
        totalStock: sql<number>`COALESCE(SUM(${productVariants.stock}), 0)`,
        variantCount: sql<number>`COUNT(*)`,
      })
      .from(productVariants)
      .where(
        and(
          eq(productVariants.productId, productId),
          eq(productVariants.isActive, true),
        ),
      );
    return {
      priceMin: Number(row?.priceMin ?? 0),
      priceMax: Number(row?.priceMax ?? 0),
      totalStock: Number(row?.totalStock ?? 0),
      variantCount: Number(row?.variantCount ?? 0),
    };
  }

  async syncProductAggregates(productId: string) {
    const agg = await this.getAggregates(productId);
    const variants = await this.findByProductId(productId);
    const active = variants.filter((v) => v.isActive);
    const first = active[0] ?? variants[0];

    await this.db
      .update(products)
      .set({
        price: first ? String(first.price) : '0',
        comparePrice: first?.comparePrice ?? null,
        stock: agg.totalStock,
      })
      .where(eq(products.id, productId));

    return agg;
  }

  async createDefaultVariant(
    productId: string,
    data: {
      sku: string;
      price: number;
      comparePrice?: number;
      stock: number;
    },
  ) {
    const id = randomUUID();
    await this.db.insert(productVariants).values({
      id,
      productId,
      sku: data.sku,
      price: String(data.price),
      comparePrice: data.comparePrice ? String(data.comparePrice) : null,
      stock: data.stock,
      isActive: true,
    });
    await this.syncProductAggregates(productId);
    return (await this.findById(id))!;
  }

  async saveProductVariants(
    productId: string,
    optionInputs: VariantOptionInput[],
    variantInputs: VariantInput[],
    productImageUrls: string[] = [],
  ) {
    const resolvedOptions = deriveOptionInputs(optionInputs, variantInputs);

    await this.db.transaction(async (tx) => {
      const existingVariants = await tx
        .select({ id: productVariants.id })
        .from(productVariants)
        .where(eq(productVariants.productId, productId));

      const existingIds = existingVariants.map((v) => v.id);
      if (existingIds.length) {
        await tx
          .delete(variantOptionValues)
          .where(inArray(variantOptionValues.variantId, existingIds));
        await tx
          .delete(productVariants)
          .where(eq(productVariants.productId, productId));
      }

      const oldOptions = await tx
        .select({ id: productOptions.id })
        .from(productOptions)
        .where(eq(productOptions.productId, productId));
      const oldOptionIds = oldOptions.map((o) => o.id);
      if (oldOptionIds.length) {
        await tx
          .delete(productOptionValues)
          .where(inArray(productOptionValues.optionId, oldOptionIds));
      }
      await tx
        .delete(productOptions)
        .where(eq(productOptions.productId, productId));
      await tx
        .delete(productImages)
        .where(eq(productImages.productId, productId));

      const optionValueMap = new Map<string, string>();
      const linkErrors: string[] = [];

      for (let oi = 0; oi < resolvedOptions.length; oi++) {
        const opt = resolvedOptions[oi];
        const optionId = randomUUID();
        await tx.insert(productOptions).values({
          id: optionId,
          productId,
          name: opt.name.trim(),
          sortOrder: oi,
        });
        for (let vi = 0; vi < opt.values.length; vi++) {
          const value = opt.values[vi].trim();
          if (!value) continue;
          const valId = randomUUID();
          await tx.insert(productOptionValues).values({
            id: valId,
            optionId,
            value,
            sortOrder: vi,
          });
          optionValueMap.set(`${opt.name.trim()}::${value}`, valId);
        }
      }

      for (const v of variantInputs) {
        const variantId = v.id ?? randomUUID();
        const { imageUrl, extraImageUrls } = resolveVariantImageInput(v);
        await tx.insert(productVariants).values({
          id: variantId,
          productId,
          sku: v.sku,
          price: String(v.price),
          comparePrice: v.comparePrice ? String(v.comparePrice) : null,
          stock: v.stock,
          weight: v.weight != null ? String(v.weight) : null,
          isActive: v.isActive ?? true,
          imageUrl,
        });

        let linkedCount = 0;
        for (const [optName, optVal] of Object.entries(v.optionValues ?? {})) {
          const optionValueId = resolveOptionValueId(
            optionValueMap,
            optName,
            optVal,
          );
          if (optionValueId) {
            linkedCount += 1;
            await tx.insert(variantOptionValues).values({
              id: randomUUID(),
              variantId,
              optionValueId,
            });
          } else if (optVal?.trim()) {
            linkErrors.push(`${v.sku}: ${optName}=${optVal}`);
          }
        }

        if (
          resolvedOptions.length > 0 &&
          Object.keys(v.optionValues ?? {}).length > 0 &&
          linkedCount === 0
        ) {
          linkErrors.push(v.sku);
        }

        const variantImageUrls = imageUrl
          ? [imageUrl, ...extraImageUrls]
          : extraImageUrls;
        for (let i = 0; i < variantImageUrls.length; i++) {
          await tx.insert(productImages).values({
            id: randomUUID(),
            productId,
            variantId,
            imageUrl: variantImageUrls[i],
            sortOrder: i,
          });
        }
      }

      for (let i = 0; i < productImageUrls.length; i++) {
        const url = productImageUrls[i]?.trim();
        if (!url) continue;
        await tx.insert(productImages).values({
          id: randomUUID(),
          productId,
          variantId: null,
          imageUrl: url,
          sortOrder: i,
        });
      }

      if (linkErrors.length) {
        throw new BusinessException(
          `Không khớp thuộc tính biến thể: ${linkErrors.slice(0, 5).join(', ')}`,
          400,
        );
      }
    });

    await this.syncProductAggregates(productId);
    await this.syncProductThumbnail(productId);
  }

  async getFirstVariantImageByProductIds(
    productIds: string[],
  ): Promise<Record<string, string>> {
    if (!productIds.length) return {};

    const rows = await this.db
      .select({
        productId: productVariants.productId,
        imageUrl: productVariants.imageUrl,
        createdAt: productVariants.createdAt,
      })
      .from(productVariants)
      .where(inArray(productVariants.productId, productIds))
      .orderBy(asc(productVariants.createdAt));

    const map: Record<string, string> = {};
    for (const row of rows) {
      const imageUrl = row.imageUrl?.trim();
      if (!imageUrl || map[row.productId]) continue;
      map[row.productId] = imageUrl;
    }
    return map;
  }

  async syncProductThumbnail(productId: string) {
    const [product] = await this.db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    if (!product) return;

    const variantData = await this.loadProductVariantData(productId);
    const productLevelImages = variantData.images.filter(Boolean);
    const variantImages = variantData.variants
      .map((v) => v.imageUrl)
      .filter((url): url is string => Boolean(url?.trim()));
    const mergedGallery = [...new Set([...productLevelImages, ...variantImages])];

    const firstVariantImage = pickFirstVariantImage(variantData.variants);
    const updates: Partial<typeof products.$inferInsert> = {};

    if (mergedGallery.length) {
      updates.images = mergedGallery;
    }

    if (!product.thumbnailUrl?.trim() && firstVariantImage) {
      updates.thumbnailUrl = firstVariantImage;
    }

    if (!Object.keys(updates).length) return;

    await this.db
      .update(products)
      .set(updates)
      .where(eq(products.id, productId));
  }

  /** @deprecated Use syncProductThumbnail */
  async syncProductImages(productId: string) {
    return this.syncProductThumbnail(productId);
  }

  /** Atomic decrement — returns undefined if insufficient stock or inactive */
  async decrementStock(
    variantId: string,
    quantity: number,
  ): Promise<ProductVariant | undefined> {
    const result = await this.db
      .update(productVariants)
      .set({ stock: sql`${productVariants.stock} - ${quantity}` })
      .where(
        and(
          eq(productVariants.id, variantId),
          eq(productVariants.isActive, true),
          gte(productVariants.stock, quantity),
        ),
      );

    const affected = (result as unknown as { affectedRows?: number })
      ?.affectedRows;
    if (affected === 0) return undefined;

    const variant = await this.findById(variantId);
    if (!variant) return undefined;
    await this.syncProductAggregates(variant.productId);
    return variant;
  }

  async findVariantIdsByOptionValue(
    optionNames: string[],
    value: string,
  ): Promise<string[]> {
    if (!value.trim()) return [];

    const rows = await this.db
      .selectDistinct({ variantId: variantOptionValues.variantId })
      .from(variantOptionValues)
      .innerJoin(
        productOptionValues,
        eq(variantOptionValues.optionValueId, productOptionValues.id),
      )
      .innerJoin(
        productOptions,
        eq(productOptionValues.optionId, productOptions.id),
      )
      .where(
        and(
          inArray(productOptions.name, optionNames),
          eq(productOptionValues.value, value.trim()),
        ),
      );

    return rows.map((r) => r.variantId);
  }

  async getShopFilterOptions(): Promise<{ colors: string[]; sizes: string[] }> {
    const fetchDistinct = async (optionName: string) => {
      const rows = await this.db
        .select({
          value: productOptionValues.value,
          sortOrder: productOptionValues.sortOrder,
        })
        .from(productOptionValues)
        .innerJoin(
          productOptions,
          eq(productOptionValues.optionId, productOptions.id),
        )
        .innerJoin(
          variantOptionValues,
          eq(variantOptionValues.optionValueId, productOptionValues.id),
        )
        .innerJoin(
          productVariants,
          eq(variantOptionValues.variantId, productVariants.id),
        )
        .innerJoin(products, eq(productVariants.productId, products.id))
        .where(
          and(
            eq(productOptions.name, optionName),
            eq(productVariants.isActive, true),
            eq(products.isActive, true),
          ),
        )
        .orderBy(asc(productOptionValues.sortOrder));

      const seen = new Set<string>();
      const values: string[] = [];
      for (const row of rows) {
        if (!seen.has(row.value)) {
          seen.add(row.value);
          values.push(row.value);
        }
      }
      return values;
    };

    const [colorsM, colorsC, colorsV, sizesM, sizesK, sizesKC] =
      await Promise.all([
        fetchDistinct('Màu sắc'),
        fetchDistinct('Color'),
        fetchDistinct('Màu'),
        fetchDistinct('Size'),
        fetchDistinct('Kích thước'),
        fetchDistinct('Kích cỡ'),
      ]);
    const colorSeen = new Set<string>();
    const colors: string[] = [];
    for (const v of [...colorsM, ...colorsC, ...colorsV]) {
      if (!colorSeen.has(v)) {
        colorSeen.add(v);
        colors.push(v);
      }
    }
    const sizeSeen = new Set<string>();
    const sizes: string[] = [];
    for (const v of [...sizesM, ...sizesK, ...sizesKC]) {
      if (!sizeSeen.has(v)) {
        sizeSeen.add(v);
        sizes.push(v);
      }
    }
    return { colors, sizes };
  }

  async restoreStock(variantId: string, quantity: number): Promise<void> {
    const variant = await this.findById(variantId);
    if (!variant) return;
    await this.db
      .update(productVariants)
      .set({ stock: variant.stock + quantity })
      .where(eq(productVariants.id, variantId));
    await this.syncProductAggregates(variant.productId);
  }

  async bulkUpdate(
    variantIds: string[],
    data: Partial<{
      price: number;
      comparePrice: number | null;
      stock: number;
      isActive: boolean;
    }>,
  ) {
    const payload: Partial<NewProductVariant> = {};
    if (data.price !== undefined) payload.price = String(data.price);
    if (data.comparePrice !== undefined)
      payload.comparePrice =
        data.comparePrice != null ? String(data.comparePrice) : null;
    if (data.stock !== undefined) payload.stock = data.stock;
    if (data.isActive !== undefined) payload.isActive = data.isActive;

    if (!Object.keys(payload).length) return;

    await this.db
      .update(productVariants)
      .set(payload)
      .where(inArray(productVariants.id, variantIds));

    const variants = await this.db
      .select({ productId: productVariants.productId })
      .from(productVariants)
      .where(inArray(productVariants.id, variantIds));

    const productIds = [...new Set(variants.map((v) => v.productId))];
    for (const pid of productIds) {
      await this.syncProductAggregates(pid);
    }
  }

  async getProductListOptionSummaries(
    productIds: string[],
  ): Promise<Record<string, { colors: string[]; sizes: string[] }>> {
    if (!productIds.length) return {};

    const colorNames: string[] = [...COLOR_OPTION_NAMES];
    const sizeNames: string[] = [...SIZE_OPTION_NAMES];

    const rows = await this.db
      .select({
        productId: productVariants.productId,
        optionName: productOptions.name,
        value: productOptionValues.value,
        sortOrder: productOptionValues.sortOrder,
      })
      .from(productVariants)
      .innerJoin(
        variantOptionValues,
        eq(variantOptionValues.variantId, productVariants.id),
      )
      .innerJoin(
        productOptionValues,
        eq(variantOptionValues.optionValueId, productOptionValues.id),
      )
      .innerJoin(
        productOptions,
        eq(productOptionValues.optionId, productOptions.id),
      )
      .where(
        and(
          inArray(productVariants.productId, productIds),
          eq(productVariants.isActive, true),
        ),
      )
      .orderBy(asc(productOptionValues.sortOrder));

    const result: Record<string, { colors: string[]; sizes: string[] }> = {};
    for (const id of productIds) {
      result[id] = { colors: [], sizes: [] };
    }

    const seen = new Map<string, Set<string>>();
    for (const row of rows) {
      const key = `${row.productId}::${row.optionName}`;
      if (!seen.has(key)) seen.set(key, new Set());
      const set = seen.get(key)!;
      if (set.has(row.value)) continue;
      set.add(row.value);

      const bucket = colorNames.includes(row.optionName)
        ? 'colors'
        : sizeNames.includes(row.optionName)
          ? 'sizes'
          : null;
      if (!bucket) continue;
      result[row.productId][bucket].push(row.value);
    }

    return result;
  }

  async findProductIdsByOptionValues(
    filters: { optionNames: string[]; values: string[] }[],
  ): Promise<string[] | null> {
    if (!filters.length) return null;

    let productIds: Set<string> | null = null;

    for (const filter of filters) {
      if (!filter.values.length || !filter.optionNames.length) continue;

      const rows = await this.db
        .selectDistinct({ productId: productVariants.productId })
        .from(productVariants)
        .innerJoin(
          variantOptionValues,
          eq(variantOptionValues.variantId, productVariants.id),
        )
        .innerJoin(
          productOptionValues,
          eq(variantOptionValues.optionValueId, productOptionValues.id),
        )
        .innerJoin(
          productOptions,
          eq(productOptionValues.optionId, productOptions.id),
        )
        .where(
          and(
            inArray(productOptions.name, filter.optionNames),
            inArray(productOptionValues.value, filter.values),
            eq(productVariants.isActive, true),
          ),
        );

      const ids = new Set(rows.map((r) => r.productId));
      if (productIds === null) {
        productIds = ids;
      } else {
        productIds = new Set([...productIds].filter((id) => ids.has(id)));
      }
    }

    return productIds ? [...productIds] : null;
  }

  formatVariantName(options: Record<string, string>): string {
    return Object.entries(options)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ');
  }
}
