import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type { ApiResponse, AuthResponse } from '@/types/api';
import type { RootState } from '../index';
import { setCredentials, logout } from '../slices/authSlice';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, { getState, arg }) => {
    const token = (getState() as RootState).auth.token;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('accessToken');
      if (stored) headers.set('Authorization', `Bearer ${stored}`);
    }
    const body =
      typeof arg === 'object' && arg !== null && 'body' in arg ? arg.body : null;
    if (body instanceof FormData) {
      headers.delete('Content-Type');
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  const url = typeof args === 'string' ? args : args.url;
  const isAuthEndpoint =
    url === '/auth/refresh' ||
    url === '/auth/login' ||
    url === '/auth/register';

  if (result.error?.status === 401 && !isAuthEndpoint) {
    const refreshToken =
      typeof window !== 'undefined'
        ? localStorage.getItem('refreshToken')
        : null;

    if (refreshToken) {
      const refreshResult = await rawBaseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions,
      );

      const payload = refreshResult.data as ApiResponse<AuthResponse> | undefined;
      if (payload?.success && payload.data) {
        api.dispatch(
          setCredentials({
            user: payload.data.user,
            token: payload.data.accessToken,
            refreshToken: payload.data.refreshToken,
          }),
        );
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logout());
      }
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Product',
    'Category',
    'Brand',
    'User',
    'Auth',
    'Dashboard',
    'Cart',
    'Order',
    'Voucher',
    'Settings',
    'Notification',
    'Payment',
    'Address',
    'Chat',
  ],
  endpoints: () => ({}),
});
