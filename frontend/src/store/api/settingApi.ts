import type { ApiResponse, Setting } from '@/types/api';
import { baseApi } from './baseApi';

export const settingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query<ApiResponse<Setting[]>, void>({
      query: () => '/settings',
      providesTags: ['Settings'],
    }),
    upsertSetting: builder.mutation<
      ApiResponse<Setting>,
      { key: string; value: string }
    >({
      query: (body) => ({ url: '/settings', method: 'PUT', body }),
      invalidatesTags: ['Settings'],
    }),
  }),
});

export const { useGetSettingsQuery, useUpsertSettingMutation } = settingApi;
