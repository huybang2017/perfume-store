import { Product } from '../../../database/schema/products';
import {
  isActiveFromStatus,
  normalizeProductStatus,
} from '../../../common/constants/product-status';
import { resolveProductThumbnail } from '../utils/product-thumbnail.util';

export interface ProductVariantResponse {
  id: string;
  sku: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  weight: number | null;
  isActive: boolean;
  options: Record<string, string>;
  imageUrl: string | null;
  imageUrls: string[];
}

export interface ProductOptionResponse {
  id: string;
  name: string;
  sortOrder: number;
  values: { id: string; value: string; sortOrder: number }[];
}

export interface ProductListExtras {
  priceMin?: number;
  priceMax?: number;
  totalStock?: number;
  availableColors?: string[];
  availableSizes?: string[];
}

export class ProductMapper {
  static resolveThumbnail(
    product: Pick<Product, 'thumbnailUrl' | 'images'>,
    variants?: ProductVariantResponse[],
  ): string | null {
    return resolveProductThumbnail(
      {
        thumbnailUrl: product.thumbnailUrl,
        images: (product.images as string[]) ?? [],
      },
      variants,
    );
  }

  static hasSelectableVariants(
    options?: ProductOptionResponse[],
    variants?: ProductVariantResponse[],
  ): boolean {
    if ((options?.length ?? 0) > 0) return true;
    const active = (variants ?? []).filter((v) => v.isActive);
    return active.length > 1;
  }

  static toResponse(
    product: Product,
    extras?: {
      priceMin?: number;
      priceMax?: number;
      totalStock?: number;
      variants?: ProductVariantResponse[];
      options?: ProductOptionResponse[];
      images?: string[];
      availableColors?: string[];
      availableSizes?: string[];
    },
  ) {
    const images = extras?.images ?? (product.images as string[]) ?? [];
    const priceMin = extras?.priceMin ?? Number(product.price);
    const priceMax = extras?.priceMax ?? Number(product.price);
    const totalStock = extras?.totalStock ?? product.stock;
    const variants = extras?.variants;
    const options = extras?.options;

    const thumbnailUrl = ProductMapper.resolveThumbnail(product, variants);
    const status = normalizeProductStatus(product.status, product.isActive);

    return {
      ...product,
      price: Number(product.price),
      comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
      images: thumbnailUrl
        ? [thumbnailUrl, ...images.filter((url) => url !== thumbnailUrl)]
        : images,
      thumbnailUrl,
      status,
      isActive: isActiveFromStatus(status),
      priceMin,
      priceMax,
      stock: totalStock,
      hasVariants:
        ProductMapper.hasSelectableVariants(options, variants) ||
        (extras?.availableColors?.length ?? 0) > 0 ||
        (extras?.availableSizes?.length ?? 0) > 0,
      variants,
      options,
      availableColors: extras?.availableColors,
      availableSizes: extras?.availableSizes,
    };
  }

  static toResponseList(
    items: {
      product: Product;
      priceMin?: number;
      priceMax?: number;
      totalStock?: number;
      availableColors?: string[];
      availableSizes?: string[];
    }[],
  ) {
    return items.map(
      ({
        product,
        priceMin,
        priceMax,
        totalStock,
        availableColors,
        availableSizes,
      }) =>
        ProductMapper.toResponse(product, {
          priceMin,
          priceMax,
          totalStock,
          availableColors,
          availableSizes,
        }),
    );
  }

  static mapVariants(
    variants: {
      id: string;
      sku: string;
      price: string;
      comparePrice: string | null;
      stock: number;
      weight: string | null;
      isActive: boolean;
      options: Record<string, string>;
      imageUrl?: string | null;
      imageUrls: string[];
    }[],
  ): ProductVariantResponse[] {
    return variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      price: Number(v.price),
      comparePrice: v.comparePrice ? Number(v.comparePrice) : null,
      stock: v.stock,
      weight: v.weight ? Number(v.weight) : null,
      isActive: v.isActive,
      options: v.options,
      imageUrl: v.imageUrl ?? v.imageUrls[0] ?? null,
      imageUrls: v.imageUrls,
    }));
  }
}
