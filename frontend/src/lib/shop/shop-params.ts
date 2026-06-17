import type { ProductListParams } from '@/store/api/productApi';
import {
  DEFAULT_SHOP_FILTERS,
  SHOP_PAGE_SIZE,
  type ShopFiltersState,
  type ShopSort,
} from '@/types/shop';

const SORT_VALUES: ShopSort[] = [
  'newest',
  'price_asc',
  'price_desc',
  'best_selling',
  'featured',
];

function parseSort(value: string | null): ShopSort {
  if (value && SORT_VALUES.includes(value as ShopSort)) {
    return value as ShopSort;
  }
  return DEFAULT_SHOP_FILTERS.sort;
}

function parseTriState(value: string | null): '' | 'true' | 'false' {
  if (value === 'true' || value === 'false') return value;
  return '';
}

function parseList(value: string | null): string[] {
  if (!value) return [];
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

export function parseShopSearchParams(
  params: URLSearchParams,
): ShopFiltersState {
  const brandsRaw = params.get('brand');
  return {
    q: params.get('q')?.trim() ?? '',
    category: params.get('category')?.trim() ?? '',
    brands: brandsRaw
      ? brandsRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : [],
    colors: parseList(params.get('color')),
    sizes: parseList(params.get('size')),
    minPrice: params.get('minPrice') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
    sort: parseSort(params.get('sort')),
    page: Math.max(1, Number(params.get('page')) || 1),
    inStock: parseTriState(params.get('inStock')),
    featured: parseTriState(params.get('featured')),
  };
}

export function buildShopSearchParams(
  filters: ShopFiltersState,
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.q) params.set('q', filters.q);
  if (filters.category) params.set('category', filters.category);
  if (filters.brands.length) params.set('brand', filters.brands.join(','));
  if (filters.colors.length) params.set('color', filters.colors.join(','));
  if (filters.sizes.length) params.set('size', filters.sizes.join(','));
  if (filters.minPrice) params.set('minPrice', filters.minPrice);
  if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
  if (filters.sort !== DEFAULT_SHOP_FILTERS.sort) params.set('sort', filters.sort);
  if (filters.page > 1) params.set('page', String(filters.page));
  if (filters.inStock) params.set('inStock', filters.inStock);
  if (filters.featured) params.set('featured', filters.featured);

  return params;
}

export function shopFiltersToApiParams(
  filters: ShopFiltersState,
): ProductListParams {
  const min = filters.minPrice ? Number(filters.minPrice) : undefined;
  const max = filters.maxPrice ? Number(filters.maxPrice) : undefined;

  return {
    page: filters.page,
    limit: SHOP_PAGE_SIZE,
    search: filters.q || undefined,
    category: filters.category || undefined,
    brand: filters.brands.length ? filters.brands.join(',') : undefined,
    color: filters.colors.length ? filters.colors.join(',') : undefined,
    size: filters.sizes.length ? filters.sizes.join(',') : undefined,
    minPrice: min != null && !Number.isNaN(min) ? min : undefined,
    maxPrice: max != null && !Number.isNaN(max) ? max : undefined,
    sort: filters.sort,
    inStock:
      filters.inStock === 'true'
        ? true
        : filters.inStock === 'false'
          ? false
          : undefined,
    isActive: true,
    isFeatured:
      filters.featured === 'true'
        ? true
        : filters.featured === 'false'
          ? false
          : undefined,
  };
}

export function countActiveFilters(filters: ShopFiltersState): number {
  let n = 0;
  if (filters.q) n++;
  if (filters.category) n++;
  if (filters.brands.length) n += filters.brands.length;
  if (filters.colors.length) n += filters.colors.length;
  if (filters.sizes.length) n += filters.sizes.length;
  if (filters.minPrice || filters.maxPrice) n++;
  if (filters.inStock) n++;
  if (filters.featured) n++;
  if (filters.sort !== DEFAULT_SHOP_FILTERS.sort) n++;
  return n;
}
