import type { ApiResponse } from '@/types/api';
import { baseApi } from './baseApi';

export interface ProductStats {
  total: number;
  active: number;
  featured: number;
  outOfStock: number;
}

export const adminProductApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProductStats: builder.query<ApiResponse<ProductStats>, void>({
      query: () => '/products/stats',
      providesTags: ['Dashboard'],
    }),
    bulkProducts: builder.mutation<
      ApiResponse<null>,
      {
        ids: string[];
        action: string;
        categoryId?: string;
        brandId?: string;
      }
    >({
      query: (body) => ({ url: '/products/bulk', method: 'PATCH', body }),
      invalidatesTags: ['Product', 'Dashboard'],
    }),
    deleteProduct: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/products/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Product', 'Dashboard'],
    }),
    duplicateProduct: builder.mutation<ApiResponse<unknown>, string>({
      query: (id) => ({ url: `/products/${id}/duplicate`, method: 'POST' }),
      invalidatesTags: ['Product'],
    }),
    bulkVariants: builder.mutation<
      ApiResponse<null>,
      {
        variantIds: string[];
        price?: number;
        comparePrice?: number;
        stock?: number;
        isActive?: boolean;
      }
    >({
      query: (body) => ({ url: '/products/variants/bulk', method: 'PATCH', body }),
      invalidatesTags: ['Product'],
    }),
  }),
});

export const {
  useGetProductStatsQuery,
  useBulkProductsMutation,
  useDeleteProductMutation,
  useDuplicateProductMutation,
  useBulkVariantsMutation,
} = adminProductApi;
