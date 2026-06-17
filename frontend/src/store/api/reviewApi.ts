import type { ApiResponse } from '@/types/api';
import { baseApi } from './baseApi';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  userName?: string;
  productName?: string;
  status?: string;
}

export const reviewApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProductReviews: builder.query<
      ApiResponse<Review[]>,
      { productId: string; page?: number; limit?: number }
    >({
      query: ({ productId, ...params }) => ({
        url: `/reviews/product/${productId}`,
        params,
      }),
    }),
    createReview: builder.mutation<
      ApiResponse<Review>,
      { productId: string; rating: number; comment?: string }
    >({
      query: (body) => ({ url: '/reviews', method: 'POST', body }),
    }),
    deleteReview: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/reviews/${id}`, method: 'DELETE' }),
    }),
    getAdminReviews: builder.query<
      ApiResponse<Review[]>,
      { page?: number; limit?: number; search?: string; status?: string; rating?: number }
    >({
      query: (params) => ({ url: '/reviews/admin/list', params }),
    }),
    getReviewStats: builder.query<
      ApiResponse<{ total: number; pending: number; approved: number; rejected: number }>,
      void
    >({
      query: () => '/reviews/admin/stats',
    }),
    setReviewStatus: builder.mutation<
      ApiResponse<null>,
      { id: string; status: 'approved' | 'rejected' }
    >({
      query: ({ id, status }) => ({
        url: `/reviews/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
    }),
  }),
});

export const {
  useGetProductReviewsQuery,
  useCreateReviewMutation,
  useDeleteReviewMutation,
  useGetAdminReviewsQuery,
  useGetReviewStatsQuery,
  useSetReviewStatusMutation,
} = reviewApi;
