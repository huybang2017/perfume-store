import type { ApiResponse, Cart } from '@/types/api';
import { baseApi } from './baseApi';

export const cartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCart: builder.query<ApiResponse<Cart>, void>({
      query: () => '/carts',
      providesTags: ['Cart'],
    }),
    addCartItem: builder.mutation<
      ApiResponse<Cart>,
      { productId: string; variantId: string; quantity: number }
    >({
      query: (body) => ({ url: '/carts/items', method: 'POST', body }),
      invalidatesTags: ['Cart'],
    }),
    updateCartItem: builder.mutation<
      ApiResponse<Cart>,
      { itemId: string; quantity: number }
    >({
      query: ({ itemId, quantity }) => ({
        url: `/carts/items/${itemId}`,
        method: 'PATCH',
        body: { quantity },
      }),
      invalidatesTags: ['Cart'],
    }),
    removeCartItem: builder.mutation<ApiResponse<Cart>, string>({
      query: (itemId) => ({ url: `/carts/items/${itemId}`, method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),
    clearCart: builder.mutation<ApiResponse<Cart>, void>({
      query: () => ({ url: '/carts', method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddCartItemMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
} = cartApi;
