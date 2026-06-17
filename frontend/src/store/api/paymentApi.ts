import type { ApiResponse } from '@/types/api';
import { baseApi } from './baseApi';

export type PaymentMethod = 'COD' | 'BANK_TRANSFER' | 'VNPAY' | 'MOMO';

export interface PaymentRecord {
  id: string;
  orderId: string;
  orderNumber?: string;
  paymentMethod: PaymentMethod;
  paymentMethodLabel: string;
  paymentStatus: string;
  paymentStatusLabel: string;
  amount: number;
  transactionId?: string;
  gatewayTransactionId?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  bankTransfer?: {
    bankName: string;
    bankAccount: string;
    bankHolder: string;
    transferContent: string;
    amount?: string;
  };
  history?: { status: string; statusLabel: string; message?: string; createdAt: string }[];
}

export interface CheckoutPaymentBody {
  paymentMethod: PaymentMethod;
  shippingAddress: Record<string, string>;
  note?: string;
  voucherCode?: string;
  shippingFee?: number;
}

export interface CheckoutPaymentResult {
  order: {
    id: string;
    orderNumber: string;
    total: number;
    paymentMethod?: string;
    paymentStatus?: string;
  };
  payment: PaymentRecord;
  redirectUrl?: string;
  bankTransfer?: PaymentRecord['bankTransfer'];
}

export interface PaymentListParams {
  page?: number;
  limit?: number;
  status?: string;
  method?: PaymentMethod;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaymentStats {
  total: number;
  successful: number;
  failed: number;
  refunded: number;
  pending: number;
}

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    checkoutPayment: builder.mutation<
      ApiResponse<CheckoutPaymentResult>,
      CheckoutPaymentBody
    >({
      query: (body) => ({ url: '/payments/checkout', method: 'POST', body }),
      invalidatesTags: ['Order', 'Cart', 'Payment'],
    }),
    getPaymentByOrder: builder.query<ApiResponse<PaymentRecord>, string>({
      query: (orderId) => `/payments/order/${orderId}`,
      providesTags: (_r, _e, orderId) => [{ type: 'Payment', id: orderId }],
    }),
    getPaymentStats: builder.query<ApiResponse<PaymentStats>, void>({
      query: () => '/payments/stats',
      providesTags: ['Payment'],
    }),
    getPayments: builder.query<ApiResponse<PaymentRecord[]>, PaymentListParams>({
      query: (params) => ({ url: '/payments', params }),
      providesTags: ['Payment'],
    }),
    getPayment: builder.query<ApiResponse<PaymentRecord>, string>({
      query: (id) => `/payments/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Payment', id }],
    }),
    confirmBankTransfer: builder.mutation<
      ApiResponse<PaymentRecord>,
      { id: string; note?: string }
    >({
      query: ({ id, note }) => ({
        url: `/payments/${id}/confirm-bank`,
        method: 'POST',
        body: { note },
      }),
      invalidatesTags: ['Payment', 'Order'],
    }),
    refundPayment: builder.mutation<
      ApiResponse<PaymentRecord>,
      { id: string; note?: string }
    >({
      query: ({ id, note }) => ({
        url: `/payments/${id}/refund`,
        method: 'POST',
        body: { note },
      }),
      invalidatesTags: ['Payment', 'Order'],
    }),
    demoConfirmPayment: builder.mutation<ApiResponse<{ orderId: string }>, string>({
      query: (orderId) => ({
        url: `/payments/demo-confirm/${orderId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Payment', 'Order'],
    }),
  }),
});

export const {
  useCheckoutPaymentMutation,
  useGetPaymentByOrderQuery,
  useGetPaymentStatsQuery,
  useGetPaymentsQuery,
  useGetPaymentQuery,
  useConfirmBankTransferMutation,
  useRefundPaymentMutation,
  useDemoConfirmPaymentMutation,
} = paymentApi;
