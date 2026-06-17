'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Layers } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { AdminFilterField, AdminToolbar } from '@/components/admin';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  useGetInventoryQuery,
  useGetInventoryFilterOptionsQuery,
  type InventoryItem,
} from '@/store/api/inventoryApi';
import { useGetProductsQuery } from '@/store/api/productApi';
import { useBulkVariantsMutation } from '@/store/api/adminProductApi';
import { useRouter, useSearchParams } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import { getVariantColor, getVariantSize } from '@/lib/variants';
import { getProductThumbnail } from '@/lib/product-images';
import { formatDateTime, formatVND, vi } from '@/lib/i18n';

type VariantRow = InventoryItem & { rowId: string; productId: string };

export default function AdminVariantsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Number(searchParams.get('limit')) || 10;
  const search = searchParams.get('search') ?? '';
  const stock = searchParams.get('stock') ?? '';
  const color = searchParams.get('color') ?? '';
  const size = searchParams.get('size') ?? '';
  const productId = searchParams.get('productId') ?? '';
  const variantStatus = searchParams.get('variantStatus') ?? '';

  const [searchInput, setSearchInput] = useState(search);
  const [bulkStock, setBulkStock] = useState('');
  const [bulkPrice, setBulkPrice] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const push = (patch: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    if (!patch.page) p.delete('page');
    router.push(`?${p.toString()}`, { scroll: false });
  };

  const { data: filterOpts } = useGetInventoryFilterOptionsQuery();
  const { data: productsData } = useGetProductsQuery({ limit: 200, all: true });
  const [bulkVariants, { isLoading: bulkLoading }] = useBulkVariantsMutation();
  const { data, isLoading, isError, refetch } = useGetInventoryQuery({
    page,
    limit,
    search: search || undefined,
    stockFilter: stock === 'low' ? 'low' : stock === 'out' ? 'out' : 'all',
    color: color || undefined,
    size: size || undefined,
    productId: productId || undefined,
    variantStatus:
      variantStatus === 'active' || variantStatus === 'inactive'
        ? variantStatus
        : undefined,
    sort: 'stock_asc',
  });

  const items = Array.isArray(data?.data) ? data.data : [];
  const meta = data?.meta;
  const colors = Array.isArray(filterOpts?.data?.colors) ? filterOpts.data.colors : [];
  const sizes = Array.isArray(filterOpts?.data?.sizes) ? filterOpts.data.sizes : [];
  const products = Array.isArray(productsData?.data) ? productsData.data : [];

  const tableRows: VariantRow[] = items.map((i) => ({
    ...i,
    productId: i.id,
    rowId: i.variantId ?? i.id,
  }));

  const filterCount = [stock, color, size, productId, variantStatus].filter(Boolean).length;

  const runBulk = async (payload: { stock?: number; price?: number }) => {
    if (selected.size === 0) return;
    await bulkVariants({ variantIds: [...selected], ...payload });
    setSelected(new Set());
    setBulkStock('');
    setBulkPrice('');
    refetch();
  };

  return (
    <div>
      <PageHeader
        title={vi.admin.variants}
        description={vi.admin.variantsDesc}
        action={<Layers className="h-8 w-8 text-blue-600" />}
      />
      <AdminToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={() => push({ search: searchInput, page: '1' })}
        searchPlaceholder="SKU, product name..."
        filterCount={filterCount}
        onClearFilters={() =>
          push({
            stock: '',
            color: '',
            size: '',
            productId: '',
            variantStatus: '',
            page: '1',
          })
        }
        filters={
          <>
            <AdminFilterField label={vi.admin.products}>
              <Select
                className="h-10"
                value={productId}
                onChange={(e) => push({ productId: e.target.value, page: '1' })}
              >
                <option value="">{vi.admin.all}</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </AdminFilterField>
            <AdminFilterField label={vi.shop.color}>
              <Select
                className="h-10"
                value={color}
                onChange={(e) => push({ color: e.target.value, page: '1' })}
              >
                <option value="">{vi.admin.all}</option>
                {colors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </AdminFilterField>
            <AdminFilterField label={vi.shop.size}>
              <Select
                className="h-10"
                value={size}
                onChange={(e) => push({ size: e.target.value, page: '1' })}
              >
                <option value="">{vi.admin.all}</option>
                {sizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </AdminFilterField>
            <AdminFilterField label={vi.admin.stock}>
              <Select
                className="h-10"
                value={stock}
                onChange={(e) => push({ stock: e.target.value, page: '1' })}
              >
                <option value="">{vi.admin.all}</option>
                <option value="low">{vi.admin.lowStock}</option>
                <option value="out">{vi.admin.outOfStock}</option>
              </Select>
            </AdminFilterField>
            <AdminFilterField label={vi.common.status}>
              <Select
                className="h-10"
                value={variantStatus}
                onChange={(e) => push({ variantStatus: e.target.value, page: '1' })}
              >
                <option value="">{vi.admin.all}</option>
                <option value="active">{vi.admin.active}</option>
                <option value="inactive">{vi.admin.inactive}</option>
              </Select>
            </AdminFilterField>
          </>
        }
      />
      <AdminDataTable<VariantRow & { id: string }>
        data={tableRows.map((r) => ({ ...r, id: r.rowId }))}
        isLoading={isLoading}
        isError={isError}
        emptyMessage={vi.common.noData}
        selectedIds={selected}
        onSelectAll={(checked) =>
          setSelected(checked ? new Set(tableRows.map((r) => r.rowId)) : new Set())
        }
        onSelectRow={(id, checked) => {
          setSelected((prev) => {
            const next = new Set(prev);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
          });
        }}
        bulkBar={
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="number"
              className="h-8 w-24"
              placeholder={vi.admin.stock}
              value={bulkStock}
              onChange={(e) => setBulkStock(e.target.value)}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={bulkLoading || selected.size === 0 || !bulkStock}
              onClick={() => {
                const n = parseInt(bulkStock, 10);
                if (!isNaN(n)) runBulk({ stock: n });
              }}
            >
              {vi.admin.bulkStock}
            </Button>
            <Input
              type="number"
              className="h-8 w-32"
              placeholder={vi.admin.price}
              value={bulkPrice}
              onChange={(e) => setBulkPrice(e.target.value)}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={bulkLoading || selected.size === 0 || !bulkPrice}
              onClick={() => {
                const n = parseInt(bulkPrice, 10);
                if (!isNaN(n)) runBulk({ price: n });
              }}
            >
              {vi.admin.bulkPrice}
            </Button>
          </div>
        }
        columns={[
          {
            key: 'image',
            header: vi.admin.variantImage,
            render: (r) => {
              return (
                <div className="h-12 w-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getProductThumbnail(r)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              );
            },
          },
          {
            key: 'name',
            header: vi.admin.products,
            render: (r) => (
              <Link
                href={`${ROUTES.admin.products}/${r.productId}`}
                className="font-medium text-blue-600 hover:underline"
              >
                {r.name}
              </Link>
            ),
          },
          {
            key: 'variantSku',
            header: vi.admin.sku,
            render: (r) => r.variantSku ?? r.sku,
          },
          {
            key: 'color',
            header: vi.shop.color,
            render: (r) => getVariantColor(r.variantOptions) ?? '—',
          },
          {
            key: 'size',
            header: vi.shop.size,
            render: (r) => getVariantSize(r.variantOptions) ?? '—',
          },
          {
            key: 'variantPrice',
            header: vi.admin.price,
            render: (r) => formatVND(r.variantPrice ?? r.priceMin ?? 0),
          },
          {
            key: 'variantComparePrice',
            header: vi.admin.comparePrice,
            render: (r) =>
              r.variantComparePrice ? formatVND(r.variantComparePrice) : '—',
          },
          {
            key: 'variantStock',
            header: vi.admin.stock,
            render: (r) => {
              const s = r.variantStock ?? r.stock;
              return (
                <Badge variant={s === 0 ? 'default' : s <= 10 ? 'warning' : 'success'}>
                  {s}
                </Badge>
              );
            },
          },
          {
            key: 'variantIsActive',
            header: vi.common.status,
            render: (r) => (
              <Badge variant={r.variantIsActive === false ? 'default' : 'success'}>
                {r.variantIsActive === false ? vi.admin.inactive : vi.admin.active}
              </Badge>
            ),
          },
          {
            key: 'variantUpdatedAt',
            header: vi.common.updatedAt,
            render: (r) =>
              r.variantUpdatedAt
                ? formatDateTime(r.variantUpdatedAt)
                : r.updatedAt
                  ? formatDateTime(r.updatedAt)
                  : '—',
          },
          {
            key: 'id',
            header: vi.common.actions,
            render: (r) => (
              <Link href={`${ROUTES.admin.products}/${r.productId}`}>
                <Button size="sm" variant="outline">
                  {vi.admin.edit}
                </Button>
              </Link>
            ),
          },
        ]}
      />
      <AdminPagination
        page={page}
        totalPages={meta?.totalPages ?? 1}
        totalItems={meta?.total ?? 0}
        pageSize={limit}
        onPageChange={(p) => push({ page: String(p) })}
        onPageSizeChange={(size) => push({ limit: String(size), page: '1' })}
      />
    </div>
  );
}
