import type { ApiResponse, Voucher, VoucherValidation } from '@/types/api';
import { baseApi } from './baseApi';

export interface VoucherStats {
  active: number;
  expired: number;
  used: number;
}

export const voucherApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVoucherStats: builder.query<ApiResponse<VoucherStats>, void>({
      query: () => '/vouchers/stats',
      providesTags: ['Voucher'],
    }),
    getVouchers: builder.query<
      ApiResponse<Voucher[]>,
      {
        page?: number;
        limit?: number;
        isActive?: boolean;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
      }
    >({
      query: (params) => ({ url: '/vouchers', params }),
      providesTags: ['Voucher'],
    }),
    validateVoucher: builder.mutation<
      ApiResponse<VoucherValidation>,
      { code: string; orderAmount: number }
    >({
      query: (body) => ({ url: '/vouchers/validate', method: 'POST', body }),
    }),
    createVoucher: builder.mutation<
      ApiResponse<Voucher>,
      {
        code: string;
        type: 'percentage' | 'fixed';
        value: number;
        description?: string;
        minOrderAmount?: number;
        maxDiscount?: number;
        usageLimit?: number;
        isActive?: boolean;
      }
    >({
      query: (body) => ({ url: '/vouchers', method: 'POST', body }),
      invalidatesTags: ['Voucher'],
    }),
    updateVoucher: builder.mutation<
      ApiResponse<Voucher>,
      { id: string; body: Partial<Voucher> }
    >({
      query: ({ id, body }) => ({ url: `/vouchers/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Voucher'],
    }),
    deleteVoucher: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/vouchers/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Voucher'],
    }),
  }),
});

export const {
  useGetVoucherStatsQuery,
  useGetVouchersQuery,
  useValidateVoucherMutation,
  useCreateVoucherMutation,
  useUpdateVoucherMutation,
  useDeleteVoucherMutation,
} = voucherApi;
