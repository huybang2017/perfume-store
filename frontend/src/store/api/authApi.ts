import type { ApiResponse, AuthResponse, User } from '@/types/api';
import { baseApi } from './baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<AuthResponse>, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    register: builder.mutation<
      ApiResponse<AuthResponse>,
      { email: string; password: string; fullName: string }
    >({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    getProfile: builder.query<ApiResponse<User>, void>({
      query: () => '/auth/profile',
      providesTags: ['Auth'],
    }),
    updateProfile: builder.mutation<
      ApiResponse<User>,
      { fullName?: string; phone?: string; avatar?: string }
    >({
      query: (body) => ({ url: '/auth/profile', method: 'PATCH', body }),
      invalidatesTags: ['Auth'],
    }),
    changePassword: builder.mutation<
      ApiResponse<null>,
      { currentPassword: string; newPassword: string }
    >({
      query: (body) => ({ url: '/auth/change-password', method: 'POST', body }),
    }),
    refreshToken: builder.mutation<ApiResponse<AuthResponse>, { refreshToken: string }>({
      query: (body) => ({ url: '/auth/refresh', method: 'POST', body }),
    }),
    logout: builder.mutation<ApiResponse<null>, { refreshToken?: string } | void>({
      query: (body) => ({ url: '/auth/logout', method: 'POST', body: body ?? {} }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
} = authApi;
