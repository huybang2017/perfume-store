import { resolveMediaUrl } from '@/lib/images';
import type { Product } from '@/types/api';

export const DEFAULT_PRODUCT_IMAGE = '/images/product-placeholder.svg';

type ProductImageSource = Pick<Product, 'thumbnailUrl' | 'images'> & {
  /** Inventory rows may pass the row variant image explicitly */
  variantImageUrl?: string | null;
};

export function resolveProductImage(url?: string | null): string {
  return resolveMediaUrl(url) ?? DEFAULT_PRODUCT_IMAGE;
}

/**
 * Thumbnail priority:
 * 1. product.thumbnailUrl (explicit / auto-synced)
 * 2. product.images[0]
 * 3. variantImageUrl (inventory row only)
 * 4. placeholder
 */
export function getProductThumbnail(
  product?: ProductImageSource | null,
): string {
  if (!product) return DEFAULT_PRODUCT_IMAGE;
  return (
    resolveMediaUrl(product.thumbnailUrl) ??
    resolveMediaUrl(product.images?.[0]) ??
    resolveMediaUrl(product.variantImageUrl) ??
    DEFAULT_PRODUCT_IMAGE
  );
}

export function getProductThumbnailFallback(
  product?: Pick<Product, 'thumbnailUrl' | 'images'> | null,
): string {
  return getProductThumbnail(product);
}

export function withDefaultProductImages(images: string[]): string[] {
  const resolved = images
    .map((url) => resolveMediaUrl(url))
    .filter((url): url is string => Boolean(url));
  return resolved.length ? resolved : [DEFAULT_PRODUCT_IMAGE];
}
