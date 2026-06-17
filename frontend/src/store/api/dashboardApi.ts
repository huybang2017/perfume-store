import type { ApiResponse } from '@/types/api';
import { baseApi } from './baseApi';

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  revenue: number;
}

export interface DashboardAnalytics {
  daily: { day: string; orders: number; revenue: number }[];
  topProducts: { productId: string; productName: string; sold: number }[];
  period: string;
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStats: builder.query<ApiResponse<DashboardStats>, void>({
      query: () => '/dashboard/stats',
      providesTags: ['Dashboard'],
    }),
    getAnalytics: builder.query<ApiResponse<DashboardAnalytics>, string | void>({
      query: (period = '30d') => ({
        url: '/dashboard/analytics',
        params: { period },
      }),
      providesTags: ['Dashboard'],
    }),
  }),
});

export const { useGetStatsQuery, useGetAnalyticsQuery } = dashboardApi;
