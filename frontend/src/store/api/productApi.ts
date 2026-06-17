import type {
  ApiResponse,
  PaginationMeta,
  Product,
  ProductVariant,
} from '@/types/api';
import type { ShopSort } from '@/types/shop';
import { baseApi } from './baseApi';

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ShopSort;
  isFeatured?: boolean;
  inStock?: boolean;
  isActive?: boolean;
  status?: 'draft' | 'active' | 'out_of_stock' | 'archived';
  color?: string;
  size?: string;
  all?: boolean;
}

export interface ProductListResult {
  data: Product[];
  meta: PaginationMeta;
}

export interface SaveVariantsBody {
  options?: { name: string; values: string[] }[];
  variants: {
    id?: string;
    sku: string;
    price: number;
    comparePrice?: number;
    stock: number;
    weight?: number;
    isActive?: boolean;
    optionValues: Record<string, string>;
    imageUrl?: string | null;
    imageUrls?: string[];
  }[];
}

export type CreateProductBody = {
  name: string;
  slug: string;
  description?: string;
  price: number;
  comparePrice?: number;
  sku?: string;
  images?: string[];
  thumbnailUrl?: string | null;
  status?: 'draft' | 'active' | 'out_of_stock' | 'archived';
  categoryId?: string;
  brandId?: string;
  stock?: number;
  isFeatured?: boolean;
} & SaveVariantsBody;

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<ApiResponse<Product[]>, ProductListParams | void>({
      query: (params) => ({ url: '/products', params: params ?? {} }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Product' as const, id })),
              { type: 'Product', id: 'LIST' },
            ]
          : [{ type: 'Product', id: 'LIST' }],
    }),
    getProduct: builder.query<ApiResponse<Product>, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Product', id }],
    }),
    getProductBySlug: builder.query<ApiResponse<Product>, string>({
      query: (slug) => `/products/slug/${slug}`,
      providesTags: (_r, _e, slug) => [{ type: 'Product', id: slug }],
    }),
    getFilterOptions: builder.query<
      ApiResponse<{ colors: string[]; sizes: string[] }>,
      void
    >({
      query: () => '/products/filter-options',
    }),
    createProduct: builder.mutation<ApiResponse<Product>, CreateProductBody>({
      query: (body) => ({ url: '/products', method: 'POST', body }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),
    updateProduct: builder.mutation<
      ApiResponse<Product>,
      { id: string; body: Partial<CreateProductBody> }
    >({
      query: ({ id, body }) => ({ url: `/products/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
      ],
    }),
    saveProductVariants: builder.mutation<
      ApiResponse<Product>,
      { id: string; body: SaveVariantsBody }
    >({
      query: ({ id, body }) => ({
        url: `/products/${id}/variants`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Product', id }],
    }),
    generateVariants: builder.mutation<
      ApiResponse<ProductVariant[]>,
      {
        id: string;
        options: { name: string; values: string[] }[];
        baseSku: string;
        basePrice: number;
        baseStock?: number;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/products/${id}/variants/generate`,
        method: 'POST',
        body,
      }),
    }),
    bulkUpdateVariants: builder.mutation<
      ApiResponse<null>,
      {
        variantIds: string[];
        price?: number;
        comparePrice?: number;
        stock?: number;
        isActive?: boolean;
      }
    >({
      query: (body) => ({
        url: '/products/variants/bulk',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Product'],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useGetProductBySlugQuery,
  useGetFilterOptionsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useSaveProductVariantsMutation,
  useGenerateVariantsMutation,
  useBulkUpdateVariantsMutation,
} = productApi;

export function mapProductListMeta(meta?: PaginationMeta) {
  return {
    totalItems: meta?.total ?? 0,
    totalPages: meta?.totalPages ?? 0,
    currentPage: meta?.page ?? 1,
    pageSize: meta?.limit ?? 15,
  };
}
