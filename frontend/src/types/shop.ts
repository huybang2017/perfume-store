export type ShopSort =
  | 'newest'
  | 'oldest'
  | 'name_asc'
  | 'name_desc'
  | 'price_asc'
  | 'price_desc'
  | 'best_selling'
  | 'featured';

export interface ShopFiltersState {
  q: string;
  category: string;
  brands: string[];
  colors: string[];
  sizes: string[];
  minPrice: string;
  maxPrice: string;
  sort: ShopSort;
  page: number;
  inStock: '' | 'true' | 'false';
  featured: '' | 'true' | 'false';
}

export const DEFAULT_SHOP_FILTERS: ShopFiltersState = {
  q: '',
  category: '',
  brands: [],
  colors: [],
  sizes: [],
  minPrice: '',
  maxPrice: '',
  sort: 'newest',
  page: 1,
  inStock: '',
  featured: '',
};

export const SHOP_PAGE_SIZE = 15;
