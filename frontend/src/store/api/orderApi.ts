import type {
  ApiResponse,
  Order,
  OrderStats,
  OrderStatus,
  ReorderResult,
} from '@/types/api';
import { baseApi } from './baseApi';

export interface MyOrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  search?: string;
  productSearch?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: 'newest' | 'oldest' | 'total_asc' | 'total_desc';
}

export const orderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyOrderStats: builder.query<ApiResponse<OrderStats>, void>({
      query: () => '/orders/my-stats',
      providesTags: [{ type: 'Order', id: 'STATS' }],
    }),
    getMyOrders: builder.query<ApiResponse<Order[]>, MyOrdersParams>({
      query: (params) => ({ url: '/orders/my-orders', params }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Order' as const, id })),
              { type: 'Order', id: 'MY_LIST' },
            ]
          : [{ type: 'Order', id: 'MY_LIST' }],
    }),
    getOrderStats: builder.query<
      ApiResponse<{
        total: number;
        pending: number;
        shipped: number;
        delivered: number;
        cancelled: number;
      }>,
      void
    >({
      query: () => '/orders/stats',
    }),
    bulkOrders: builder.mutation<
      ApiResponse<null>,
      { ids: string[]; action: 'confirm' | 'cancel' }
    >({
      query: (body) => ({ url: '/orders/bulk', method: 'PATCH', body }),
      invalidatesTags: ['Order'],
    }),
    getOrders: builder.query<ApiResponse<Order[]>, MyOrdersParams>({
      query: (params) => ({ url: '/orders', params }),
      providesTags: ['Order'],
    }),
    getOrder: builder.query<ApiResponse<Order>, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Order', id }],
    }),
    checkout: builder.mutation<
      ApiResponse<Order>,
      {
        shippingAddress: Record<string, string>;
        note?: string;
        voucherCode?: string;
        shippingFee?: number;
      }
    >({
      query: (body) => ({ url: '/orders/checkout', method: 'POST', body }),
      invalidatesTags: ['Order', 'Cart'],
    }),
    updateOrderStatus: builder.mutation<
      ApiResponse<Order>,
      { id: string; status: OrderStatus }
    >({
      query: ({ id, status }) => ({
        url: `/orders/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Order'],
    }),
    cancelOrder: builder.mutation<
      ApiResponse<Order>,
      string | { id: string; reason: string; note?: string }
    >({
      query: (arg) => {
        const id = typeof arg === 'string' ? arg : arg.id;
        const body =
          typeof arg === 'string'
            ? { reason: 'Cancelled by admin' }
            : { reason: arg.reason, note: arg.note };
        return {
          url: `/orders/${id}/cancel`,
          method: 'PATCH',
          body,
        };
      },
      invalidatesTags: (_r, _e, arg) => {
        const id = typeof arg === 'string' ? arg : arg.id;
        return [
          { type: 'Order', id },
          { type: 'Order', id: 'MY_LIST' },
          { type: 'Order', id: 'STATS' },
        ];
      },
    }),
    reorder: builder.mutation<ApiResponse<ReorderResult>, string>({
      query: (id) => ({ url: `/orders/${id}/reorder`, method: 'POST' }),
      invalidatesTags: ['Cart'],
    }),
  }),
});

export const {
  useGetMyOrderStatsQuery,
  useGetOrderStatsQuery,
  useBulkOrdersMutation,
  useGetMyOrdersQuery,
  useGetOrdersQuery,
  useGetOrderQuery,
  useCheckoutMutation,
  useUpdateOrderStatusMutation,
  useCancelOrderMutation,
  useReorderMutation,
} = orderApi;
