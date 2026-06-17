'use client';

import { useState } from 'react';
import { Package } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import {
  AdminDataTable,
  AdminPagination,
  AdminStatsRow,
  AdminFilterField,
  AdminToolbar,
} from '@/components/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  useGetInventoryQuery,
  useGetInventoryStatsQuery,
  useUpdateStockMutation,
  type InventoryItem,
} from '@/store/api/inventoryApi';
import { useGetCategoriesQuery } from '@/store/api/categoryApi';
import { useGetBrandsQuery } from '@/store/api/brandApi';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatVND, vi } from '@/lib/i18n';

export default function AdminInventoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Number(searchParams.get('limit')) || 10;
  const search = searchParams.get('search') ?? '';
  const stockFilter = searchParams.get('stock') ?? 'all';
  const categoryId = searchParams.get('categoryId') ?? '';
  const brandId = searchParams.get('brandId') ?? '';
  const sort = searchParams.get('sort') ?? 'stock_asc';

  const [searchInput, setSearchInput] = useState(search);
  const [editing, setEditing] = useState<Record<string, string>>({});

  const push = (patch: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    if (!patch.page) p.delete('page');
    router.push(`?${p.toString()}`, { scroll: false });
  };

  const { data: statsData, isLoading: statsLoading } = useGetInventoryStatsQuery();
  const { data, isLoading, isError, refetch } = useGetInventoryQuery({
    page,
    limit,
    search: search || undefined,
    stockFilter: stockFilter as 'all' | 'low' | 'out',
    categoryId: categoryId || undefined,
    brandId: brandId || undefined,
    sort: sort as 'stock_asc' | 'stock_desc' | 'name_asc' | 'name_desc',
  });
  const { data: catData } = useGetCategoriesQuery({ page: 1, limit: 100 });
  const { data: brandData } = useGetBrandsQuery({ page: 1, limit: 100 });
  const [updateStock] = useUpdateStockMutation();

  const items = Array.isArray(data?.data) ? data.data : [];
  const meta = data?.meta;
  const filterCount = [stockFilter !== 'all' ? stockFilter : '', categoryId, brandId].filter(Boolean).length;

  const handleSave = async (productId: string) => {
    const stock = parseInt(editing[productId], 10);
    if (isNaN(stock) || stock < 0) return;
    await updateStock({ productId, stock });
    setEditing((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
    refetch();
  };

  return (
    <div>
      <PageHeader title={vi.admin.inventory} description={vi.admin.inventoryDesc} />

      <AdminStatsRow
        isLoading={statsLoading}
        columns={3}
        stats={[
          { label: vi.admin.totalStockUnits, value: statsData?.data?.totalStock, icon: Package },
          { label: vi.admin.lowStockItems, value: statsData?.data?.lowStockItems, icon: Package, accent: 'warning' },
          { label: vi.admin.outOfStockItems, value: statsData?.data?.outOfStockItems, icon: Package },
        ]}
      />

      <AdminToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={() => push({ search: searchInput, page: '1' })}
        searchPlaceholder="SKU, product name..."
        sortValue={sort}
        sortOptions={[
          { value: 'stock_asc', label: vi.admin.sortStockAsc },
          { value: 'stock_desc', label: vi.admin.sortStockDesc },
        ]}
        onSortChange={(v) => push({ sort: v, page: '1' })}
        filterCount={filterCount}
        onClearFilters={() => push({ stock: 'all', categoryId: '', brandId: '', page: '1' })}
        filters={
          <>
            <AdminFilterField label={vi.admin.stock}>
              <Select
                className="h-10"
                value={stockFilter}
                onChange={(e) => push({ stock: e.target.value, page: '1' })}
              >
                <option value="all">{vi.admin.all}</option>
                <option value="low">{vi.admin.lowStock}</option>
                <option value="out">{vi.admin.outOfStock}</option>
              </Select>
            </AdminFilterField>
            <AdminFilterField label={vi.shop.category}>
              <Select
                className="h-10"
                value={categoryId}
                onChange={(e) => push({ categoryId: e.target.value, page: '1' })}
              >
                <option value="">{vi.admin.all}</option>
                {(catData?.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </AdminFilterField>
            <AdminFilterField label={vi.shop.brand}>
              <Select
                className="h-10"
                value={brandId}
                onChange={(e) => push({ brandId: e.target.value, page: '1' })}
              >
                <option value="">{vi.admin.all}</option>
                {(brandData?.data ?? []).map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            </AdminFilterField>
          </>
        }
      />

      <AdminDataTable<InventoryItem>
        data={items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage={
          search || filterCount > 0 ? vi.common.noData : vi.admin.noLowStock
        }
        emptyDescription={
          search || filterCount > 0 ? undefined : vi.admin.healthyStock
        }
        columns={[
          { key: 'name', header: vi.admin.products },
          {
            key: 'variantSku',
            header: vi.admin.sku,
            render: (r) => r.variantSku ?? r.sku,
          },
          {
            key: 'variantStock',
            header: vi.admin.current,
            render: (r) => {
              const stock = r.variantStock ?? r.stock;
              const variant =
                stock === 0 ? 'default' : stock <= 10 ? 'warning' : 'success';
              return (
                <Badge variant={variant}>
                  {stock} {vi.admin.units}
                </Badge>
              );
            },
          },
          {
            key: 'variantPrice',
            header: vi.admin.price,
            render: (r) => formatVND(r.variantPrice ?? r.priceMin ?? 0),
          },
          {
            key: 'id',
            header: vi.admin.adjustStock,
            render: (r) => (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  className="h-9 w-24"
                  value={editing[r.id] ?? String(r.variantStock ?? r.stock)}
                  onChange={(e) =>
                    setEditing((prev) => ({ ...prev, [r.id]: e.target.value }))
                  }
                />
                <Button size="sm" variant="secondary" onClick={() => handleSave(r.id)}>
                  {vi.common.save}
                </Button>
              </div>
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
