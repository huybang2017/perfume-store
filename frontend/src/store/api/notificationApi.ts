import type { ApiResponse } from '@/types/api';
import { baseApi } from './baseApi';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body?: string | null;
  isRead: boolean;
  createdAt: string;
}

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      ApiResponse<Notification[]>,
      { page?: number; limit?: number; unreadOnly?: boolean }
    >({
      query: (params) => ({ url: '/notifications', params }),
      providesTags: ['Notification'],
    }),
    markNotificationRead: builder.mutation<ApiResponse<Notification>, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
} = notificationApi;
