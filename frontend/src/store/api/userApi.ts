import type { ApiResponse, User } from '@/types/api';
import { baseApi } from './baseApi';

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  role?: string;
  isActive?: boolean;
}

export interface UserStats {
  total: number;
  active: number;
  newCustomers: number;
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserStats: builder.query<ApiResponse<UserStats>, { role?: string } | void>({
      query: (params) => ({ url: '/users/stats', params: params ?? {} }),
    }),
    getUsers: builder.query<ApiResponse<User[]>, UserListParams>({
      query: (params) => ({ url: '/users', params }),
      providesTags: ['User'],
    }),
    getUser: builder.query<ApiResponse<User>, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'User', id }],
    }),
    createUser: builder.mutation<
      ApiResponse<User>,
      {
        email: string;
        password: string;
        fullName: string;
        phone?: string;
        role?: string;
      }
    >({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation<
      ApiResponse<User>,
      { id: string; body: Partial<Pick<User, 'fullName' | 'phone' | 'isActive'>> }
    >({
      query: ({ id, body }) => ({ url: `/users/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'User', id }, 'User'],
    }),
  }),
});

export const {
  useGetUserStatsQuery,
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
} = userApi;
