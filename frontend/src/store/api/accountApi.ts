import type { ApiResponse, UserAddress } from '@/types/api';
import { baseApi } from './baseApi';

export const accountApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAddresses: builder.query<ApiResponse<UserAddress[]>, void>({
      query: () => '/account/addresses',
      providesTags: ['Address'],
    }),
    createAddress: builder.mutation<
      ApiResponse<UserAddress>,
      Omit<UserAddress, 'id' | 'createdAt' | 'updatedAt'> & { label?: string }
    >({
      query: (body) => ({ url: '/account/addresses', method: 'POST', body }),
      invalidatesTags: ['Address'],
    }),
    updateAddress: builder.mutation<
      ApiResponse<UserAddress>,
      { id: string } & Partial<Omit<UserAddress, 'id' | 'createdAt' | 'updatedAt'>>
    >({
      query: ({ id, ...body }) => ({
        url: `/account/addresses/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Address'],
    }),
    deleteAddress: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/account/addresses/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Address'],
    }),
  }),
});

export const {
  useGetAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} = accountApi;
