'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Copy, Package, Star, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { AdminStatsRow } from '@/components/admin/AdminStatsRow';
import { AdminFilterField, AdminToolbar } from '@/components/admin';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useGetProductsQuery, mapProductListMeta, type ProductListParams } from '@/store/api/productApi';
import {
  useGetProductStatsQuery,
  useBulkProductsMutation,
  useDeleteProductMutation,
  useDuplicateProductMutation,
} from '@/store/api/adminProductApi';
import { useGetCategoriesQuery } from '@/store/api/categoryApi';
import { useGetBrandsQuery } from '@/store/api/brandApi';
import { stockBadge } from '@/lib/design';
import { getProductThumbnail } from '@/lib/product-images';
import {
  getProductStatusBadgeVariant,
  getProductStatusLabel,
  normalizeProductStatus,
} from '@/lib/product-status';
import { formatDateTime, formatPriceRange, formatVND, vi } from '@/lib/i18n';
import { ROUTES } from '@/constants/routes';
import type { Product } from '@/types/api';
import type { ShopSort } from '@/types/shop';

const SORT_MAP: Record<string, ShopSort> = {
  newest: 'newest',
  oldest: 'oldest' as ShopSort,
  name_asc: 'name_asc' as ShopSort,
  name_desc: 'name_desc' as ShopSort,
  price_asc: 'price_asc',
  price_desc: 'price_desc',
  best_selling: 'best_selling',
};

export function AdminProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Number(searchParams.get('limit')) || 10;
  const search = searchParams.get('search') ?? '';
  const [searchInput, setSearchInput] = useState(search);
  const category = searchParams.get('category') ?? '';
  const brand = searchParams.get('brand') ?? '';
  const status = searchParams.get('status') ?? '';
  const featured = searchParams.get('featured') ?? '';
  const stock = searchParams.get('stock') ?? '';
  const sort = searchParams.get('sort') ?? 'newest';

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkCategory, setBulkCategory] = useState('');

  const push = useCallback(
    (patch: Record<string, string>) => {
      const p = new URLSearchParams(searchParams.toString());
      Object.entries(patch).forEach(([k, v]) => {
        if (v) p.set(k, v);
        else p.delete(k);
      });
      if (!patch.page) p.delete('page');
      router.push(`?${p.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => setSearchInput(search), [search]);

  const apiParams: ProductListParams = {
    page,
    limit,
    search: search || undefined,
    category: category || undefined,
    brand: brand || undefined,
    sort: (SORT_MAP[sort] ?? 'newest') as ProductListParams['sort'],
    all: true,
    isFeatured: featured === 'true' ? true : featured === 'false' ? false : undefined,
    status:
      status === 'draft' ||
      status === 'active' ||
      status === 'out_of_stock' ||
      status === 'archived'
        ? status
        : undefined,
    inStock: stock === 'in' ? true : stock === 'out' ? false : undefined,
  };

  const { data, isLoading, isFetching, isError } = useGetProductsQuery(apiParams);
  const { data: statsData, isLoading: statsLoading } = useGetProductStatsQuery();
  const { data: catData } = useGetCategoriesQuery({ page: 1, limit: 100 });
  const { data: brandData } = useGetBrandsQuery({ page: 1, limit: 100 });
  const [bulkProducts] = useBulkProductsMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [duplicateProduct] = useDuplicateProductMutation();

  const products = Array.isArray(data?.data) ? data.data : [];
  const meta = mapProductListMeta(data?.meta);
  const categories = Array.isArray(catData?.data) ? catData.data : [];
  const brands = Array.isArray(brandData?.data) ? brandData.data : [];

  const filterCount = [category, brand, status, featured, stock].filter(Boolean).length;

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(products.map((p) => p.id)) : new Set());
  };

  const toggleRow = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const runBulk = async (action: string, extra?: { categoryId?: string; brandId?: string }) => {
    const ids = [...selected];
    if (!ids.length) return;
    await bulkProducts({ ids, action, ...extra } as Parameters<typeof bulkProducts>[0]);
    setSelected(new Set());
  };

  const sortOptions = useMemo(
    () => [
      { value: 'newest', label: vi.admin.sortNewest },
      { value: 'oldest', label: vi.admin.sortOldest },
      { value: 'name_asc', label: vi.admin.sortNameAsc },
      { value: 'name_desc', label: vi.admin.sortNameDesc },
      { value: 'price_asc', label: vi.admin.sortPriceAsc },
      { value: 'price_desc', label: vi.admin.sortPriceDesc },
      { value: 'best_selling', label: vi.admin.bestSelling },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title={vi.admin.products}
        description={vi.admin.productsDesc}
        action={
          <Link href={`${ROUTES.admin.products}/new`}>
            <Button>{vi.admin.addNew}</Button>
          </Link>
        }
      />

      <AdminStatsRow
        isLoading={statsLoading}
        stats={[
          { label: vi.admin.totalProducts, value: statsData?.data?.total, icon: Package },
          { label: vi.admin.activeProducts, value: statsData?.data?.active, icon: Package, accent: 'success' },
          { label: vi.admin.outOfStockProducts, value: statsData?.data?.outOfStock, icon: Package, accent: 'warning' },
          { label: vi.admin.featuredProducts, value: statsData?.data?.featured, icon: Star, accent: 'primary' },
        ]}
      />

      <AdminToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={() => push({ search: searchInput, page: '1' })}
        searchPlaceholder={vi.admin.searchPlaceholder}
        sortValue={sort}
        sortOptions={sortOptions}
        onSortChange={(v) => push({ sort: v, page: '1' })}
        filterCount={filterCount}
        onClearFilters={() =>
          push({ category: '', brand: '', status: '', featured: '', stock: '', page: '1' })
        }
        filters={
          <>
            <AdminFilterField label={vi.shop.category}>
              <Select
                className="h-10"
                value={category}
                onChange={(e) => push({ category: e.target.value, page: '1' })}
              >
                <option value="">{vi.admin.all}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </AdminFilterField>
            <AdminFilterField label={vi.shop.brand}>
              <Select
                className="h-10"
                value={brand}
                onChange={(e) => push({ brand: e.target.value, page: '1' })}
              >
                <option value="">{vi.admin.all}</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </AdminFilterField>
            <AdminFilterField label={vi.common.status}>
              <Select
                className="h-10"
                value={status}
                onChange={(e) => push({ status: e.target.value, page: '1' })}
              >
                <option value="">{vi.admin.all}</option>
                <option value="draft">{vi.admin.statusDraft}</option>
                <option value="active">{vi.admin.statusActive}</option>
                <option value="out_of_stock">{vi.admin.statusOutOfStock}</option>
                <option value="archived">{vi.admin.statusArchived}</option>
              </Select>
            </AdminFilterField>
            <AdminFilterField label={vi.admin.featured}>
              <Select
                className="h-10"
                value={featured}
                onChange={(e) => push({ featured: e.target.value, page: '1' })}
              >
                <option value="">{vi.admin.all}</option>
                <option value="true">{vi.admin.featured}</option>
                <option value="false">{vi.admin.notFeatured}</option>
              </Select>
            </AdminFilterField>
            <AdminFilterField label={vi.admin.stock}>
              <Select
                className="h-10"
                value={stock}
                onChange={(e) => push({ stock: e.target.value, page: '1' })}
              >
                <option value="">{vi.admin.all}</option>
                <option value="in">{vi.admin.inStock}</option>
                <option value="out">{vi.admin.outOfStock}</option>
              </Select>
            </AdminFilterField>
          </>
        }
      />

      <div className={isFetching ? 'opacity-70 transition-opacity' : ''}>
        <AdminDataTable<Product>
          data={products}
          isLoading={isLoading}
          isError={isError}
          emptyMessage={vi.admin.noProducts}
          selectedIds={selected}
          onSelectAll={toggleAll}
          onSelectRow={toggleRow}
          bulkBar={
            <>
              <Button size="sm" variant="outline" onClick={() => runBulk('activate')}>
                {vi.admin.bulkActivate}
              </Button>
              <Button size="sm" variant="outline" onClick={() => runBulk('deactivate')}>
                {vi.admin.bulkDeactivate}
              </Button>
              <Button size="sm" variant="danger" onClick={() => runBulk('delete')}>
                {vi.admin.bulkDelete}
              </Button>
              <Select
                className="h-8 w-40"
                value={bulkCategory}
                onChange={(e) => {
                  setBulkCategory(e.target.value);
                  if (e.target.value) {
                    const cat = categories.find((c) => c.id === e.target.value);
                    if (cat) runBulk('set_category', { categoryId: cat.id });
                    setBulkCategory('');
                  }
                }}
              >
                <option value="">{vi.admin.updateCategory}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </>
          }
          columns={[
            {
              key: 'image',
              header: vi.admin.productImages,
              render: (r) => (
                <div className="h-10 w-10 overflow-hidden rounded-lg bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getProductThumbnail(r)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              ),
            },
            {
              key: 'name',
              header: vi.admin.products,
              render: (r) => <p className="font-medium">{r.name}</p>,
            },
            {
              key: 'category',
              header: vi.shop.category,
              render: (r) =>
                categories.find((c) => c.id === r.categoryId)?.name ?? '—',
            },
            {
              key: 'brand',
              header: vi.shop.brand,
              render: (r) => brands.find((b) => b.id === r.brandId)?.name ?? '—',
            },
            {
              key: 'price',
              header: vi.admin.price,
              render: (r) =>
                r.priceMin != null && r.priceMax != null && r.priceMin !== r.priceMax
                  ? formatPriceRange(r.priceMin, r.priceMax)
                  : formatVND(r.priceMin ?? r.price),
            },
            {
              key: 'stock',
              header: vi.admin.stock,
              render: (r) => {
                const s = stockBadge(r.stock);
                return <Badge variant={s.variant}>{r.stock}</Badge>;
              },
            },
            {
              key: 'status',
              header: vi.common.status,
              render: (r) => {
                const productStatus = normalizeProductStatus(r.status, r.isActive);
                return (
                  <Badge variant={getProductStatusBadgeVariant(productStatus)}>
                    {getProductStatusLabel(productStatus)}
                  </Badge>
                );
              },
            },
            {
              key: 'isFeatured',
              header: vi.admin.featured,
              render: (r) =>
                r.isFeatured ? (
                  <Badge variant="default" className="gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    {vi.admin.featured}
                  </Badge>
                ) : (
                  '—'
                ),
            },
            {
              key: 'updatedAt',
              header: vi.common.updatedAt,
              render: (r) => (r.updatedAt ? formatDateTime(r.updatedAt) : '—'),
            },
            {
              key: 'actions',
              header: vi.common.actions,
              render: (r) => (
                <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                  <Link href={`${ROUTES.admin.products}/${r.id}`}>
                    <Button size="sm" variant="outline">{vi.admin.edit}</Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => duplicateProduct(r.id)}
                    title={vi.admin.duplicate}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteId(r.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </div>

      <AdminPagination
        page={meta.currentPage}
        totalPages={meta.totalPages}
        totalItems={meta.totalItems}
        pageSize={limit}
        onPageChange={(p) => push({ page: String(p) })}
        onPageSizeChange={(size) => push({ limit: String(size), page: '1' })}
        isLoading={isFetching}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title={vi.admin.confirmDelete}
        description={vi.admin.confirmDeleteDesc}
        onConfirm={async () => {
          if (deleteId) await deleteProduct(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
