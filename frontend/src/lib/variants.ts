import { vi } from '@/lib/i18n';
import { resolveMediaUrl } from '@/lib/images';
import {
  getProductThumbnailFallback,
  withDefaultProductImages,
} from '@/lib/product-images';
import type { Product, ProductVariant } from '@/types/api';

const COLOR_OPTION_NAMES = new Set(['Màu sắc', 'Color', 'Màu']);
const SIZE_OPTION_NAMES = new Set(['Size', 'Kích thước', 'Kích cỡ']);

/** Hex swatches for common color names (English and legacy Vietnamese labels) */
export const COLOR_SWATCHES: Record<string, string> = {
  Black: '#1a1a1a',
  White: '#f5f5f5',
  Blue: '#2563eb',
  Green: '#16a34a',
  Red: '#dc2626',
  Yellow: '#eab308',
  Pink: '#ec4899',
  Gray: '#6b7280',
  Grey: '#6b7280',
  Brown: '#78350f',
  Beige: '#d6d3d1',
  Cream: '#fef3c7',
  Đen: '#1a1a1a',
  Trắng: '#f5f5f5',
  Xanh: '#2563eb',
  'Xanh dương': '#2563eb',
  'Xanh lá': '#16a34a',
  Đỏ: '#dc2626',
  Vàng: '#eab308',
  Hồng: '#ec4899',
  Xám: '#6b7280',
  Nâu: '#78350f',
  Be: '#d6d3d1',
  Kem: '#fef3c7',
};

export function isColorOption(name: string): boolean {
  return COLOR_OPTION_NAMES.has(name);
}

export function isSizeOption(name: string): boolean {
  return SIZE_OPTION_NAMES.has(name);
}

export function getOptionDisplayLabel(optionName: string): string {
  if (isColorOption(optionName)) return vi.product.color;
  if (isSizeOption(optionName)) return vi.product.size;
  return optionName;
}

export function getOptionSelectPrompt(optionName: string): string {
  if (isColorOption(optionName)) return vi.product.selectColor;
  if (isSizeOption(optionName)) return vi.product.selectSize;
  return `${vi.product.selectOption}: ${optionName}`;
}

export function formatSelectedCombination(
  options: Record<string, string>,
): string {
  return Object.values(options).filter(Boolean).join(' + ');
}

export function parseVariantName(
  variantName?: string | null,
): Record<string, string> {
  if (!variantName?.trim()) return {};
  const result: Record<string, string> = {};
  for (const part of variantName.split(' · ')) {
    const idx = part.indexOf(':');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key && value) result[key] = value;
  }
  return result;
}

export type VariantDisplayOptions = Record<string, string>;

export function ensureOptionRecord(
  value?: VariantDisplayOptions | null,
): VariantDisplayOptions {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export function normalizeVariantOptions(
  variantOptions?: VariantDisplayOptions | null,
  variantName?: string | null,
): VariantDisplayOptions {
  if (variantOptions && Object.keys(variantOptions).length > 0) {
    return variantOptions;
  }
  return parseVariantName(variantName);
}

export function sortVariantOptionEntries(
  entries: [string, string][],
): [string, string][] {
  return [...entries].sort(([a], [b]) => {
    const aColor = isColorOption(a);
    const bColor = isColorOption(b);
    if (aColor && !bColor) return -1;
    if (!aColor && bColor) return 1;
    const aSize = isSizeOption(a);
    const bSize = isSizeOption(b);
    if (aSize && !bSize) return -1;
    if (!aSize && bSize) return 1;
    return a.localeCompare(b, 'en');
  });
}

export function stockStatusMessage(stock: number): string {
  if (stock < 1) return vi.product.outOfStock;
  return vi.product.unitsInStock.replace('{count}', String(stock));
}

export function getOptionValueByKind(
  options: VariantDisplayOptions,
  kind: 'color' | 'size',
): string | undefined {
  const names = kind === 'color' ? COLOR_OPTION_NAMES : SIZE_OPTION_NAMES;
  for (const name of names) {
    const value = options[name]?.trim();
    if (value) return value;
  }
  for (const [key, value] of Object.entries(options)) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    if (kind === 'color' && isColorOption(key)) return trimmed;
    if (kind === 'size' && isSizeOption(key)) return trimmed;
  }
  return undefined;
}

export function getVariantColor(
  options?: VariantDisplayOptions | null,
): string | undefined {
  return getOptionValueByKind(ensureOptionRecord(options), 'color');
}

export function getVariantSize(
  options?: VariantDisplayOptions | null,
): string | undefined {
  return getOptionValueByKind(ensureOptionRecord(options), 'size');
}

export function getVariantPrimaryImage(
  variant?: Pick<ProductVariant, 'imageUrl' | 'imageUrls'> | null,
): string | undefined {
  if (!variant) return undefined;
  return resolveMediaUrl(variant.imageUrl ?? variant.imageUrls?.[0]);
}

export function findVariantByPartialSelection(
  variants: ProductVariant[],
  selection: Record<string, string>,
): ProductVariant | undefined {
  const entries = Object.entries(selection).filter(([, value]) => value);
  if (!entries.length) return undefined;
  return variants.find(
    (variant) =>
      variant.isActive &&
      entries.every(([name, value]) => variant.options?.[name] === value),
  );
}

export function resolveProductDisplayImages(
  product: Pick<Product, 'thumbnailUrl' | 'images' | 'variants'>,
  selectedVariant: ProductVariant | null,
  partialSelection: Record<string, string>,
): string[] {
  const productFallback = getProductThumbnailFallback(product);
  const fallback = [productFallback];

  if (selectedVariant) {
    const primary = getVariantPrimaryImage(selectedVariant);
    if (primary) {
      return [primary, ...fallback.filter((url) => url !== primary)];
    }
    return fallback;
  }

  const partialMatch = findVariantByPartialSelection(
    product.variants ?? [],
    partialSelection,
  );
  const partialImage = getVariantPrimaryImage(partialMatch);
  if (partialImage) {
    return [partialImage, ...fallback.filter((url) => url !== partialImage)];
  }

  return fallback;
}
