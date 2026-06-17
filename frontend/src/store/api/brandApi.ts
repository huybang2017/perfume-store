import type { ApiResponse, Brand } from '@/types/api';
import { baseApi } from './baseApi';

export const brandApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBrands: builder.query<
      ApiResponse<Brand[]>,
      { page?: number; limit?: number; search?: string }
    >({
      query: (params) => ({ url: '/brands', params }),
      providesTags: ['Brand'],
    }),
    createBrand: builder.mutation<
      ApiResponse<Brand>,
      { name: string; slug: string; description?: string }
    >({
      query: (body) => ({ url: '/brands', method: 'POST', body }),
      invalidatesTags: ['Brand'],
    }),
    updateBrand: builder.mutation<
      ApiResponse<Brand>,
      { id: string; body: Partial<{ name: string; slug: string }> }
    >({
      query: ({ id, body }) => ({ url: `/brands/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Brand'],
    }),
    deleteBrand: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/brands/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Brand'],
    }),
  }),
});

export const {
  useGetBrandsQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
} = brandApi;
