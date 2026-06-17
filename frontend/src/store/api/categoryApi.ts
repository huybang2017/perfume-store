import type { ApiResponse, Category } from '@/types/api';
import { baseApi } from './baseApi';

export const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<
      ApiResponse<Category[]>,
      { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string }
    >({
      query: (params) => ({ url: '/categories', params }),
      providesTags: ['Category'],
    }),
    createCategory: builder.mutation<
      ApiResponse<Category>,
      { name: string; slug: string; description?: string }
    >({
      query: (body) => ({ url: '/categories', method: 'POST', body }),
      invalidatesTags: ['Category'],
    }),
    updateCategory: builder.mutation<
      ApiResponse<Category>,
      { id: string; body: Partial<{ name: string; slug: string; description?: string }> }
    >({
      query: ({ id, body }) => ({ url: `/categories/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Category'],
    }),
    deleteCategory: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Category'],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;
