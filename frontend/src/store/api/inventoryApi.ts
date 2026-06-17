import type { ApiResponse, Product } from '@/types/api';
import { baseApi } from './baseApi';

export interface InventoryItem extends Product {
  variantId?: string;
  variantSku?: string;
  variantStock?: number;
  variantPrice?: number;
  variantComparePrice?: number;
  variantOptions?: Record<string, string>;
  variantImageUrl?: string | null;
  variantIsActive?: boolean;
  variantUpdatedAt?: string;
}

export interface InventoryListParams {
  page?: number;
  limit?: number;
  search?: string;
  stockFilter?: 'all' | 'low' | 'out';
  categoryId?: string;
  brandId?: string;
  color?: string;
  size?: string;
  productId?: string;
  variantStatus?: 'active' | 'inactive';
  sort?: 'stock_asc' | 'stock_desc' | 'name_asc' | 'name_desc';
}

export interface InventoryFilterOptions {
  colors: string[];
  sizes: string[];
}

export interface InventoryStats {
  totalStock: number;
  lowStockItems: number;
  outOfStockItems: number;
}

export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInventoryStats: builder.query<ApiResponse<InventoryStats>, void>({
      query: () => '/inventory/stats',
      providesTags: ['Product'],
    }),
    getInventoryFilterOptions: builder.query<
      ApiResponse<InventoryFilterOptions>,
      void
    >({
      query: () => '/inventory/filter-options',
    }),
    getInventory: builder.query<ApiResponse<InventoryItem[]>, InventoryListParams>({
      query: (params) => ({ url: '/inventory', params }),
      providesTags: ['Product'],
    }),
    getLowStock: builder.query<ApiResponse<InventoryItem[]>, InventoryListParams | void>({
      query: (params) => ({ url: '/inventory/low-stock', params: params ?? {} }),
      providesTags: ['Product'],
    }),
    updateStock: builder.mutation<
      ApiResponse<Product>,
      { productId: string; stock: number }
    >({
      query: ({ productId, stock }) => ({
        url: `/inventory/${productId}/stock`,
        method: 'PATCH',
        body: { stock },
      }),
      invalidatesTags: ['Product'],
    }),
  }),
});

export const {
  useGetInventoryStatsQuery,
  useGetInventoryFilterOptionsQuery,
  useGetInventoryQuery,
  useGetLowStockQuery,
  useUpdateStockMutation,
} = inventoryApi;
