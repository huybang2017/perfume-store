'use client';

import { useState } from 'react';
import { Award, Plus } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { AdminStatsRow } from '@/components/admin/AdminStatsRow';
import { AdminFilterField, AdminToolbar } from '@/components/admin';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { FormField } from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  useCreateBrandMutation,
  useDeleteBrandMutation,
  useGetBrandsQuery,
  useUpdateBrandMutation,
} from '@/store/api/brandApi';
import { useRouter, useSearchParams } from 'next/navigation';
import { vi } from '@/lib/i18n';
import type { Brand } from '@/types/api';

export function AdminBrandsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Number(searchParams.get('limit')) || 10;
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const [searchInput, setSearchInput] = useState(search);

  const push = (patch: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    if (!patch.page) p.delete('page');
    router.push(`?${p.toString()}`, { scroll: false });
  };

  const { data, isLoading, isError } = useGetBrandsQuery({ page, limit, search: search || undefined });
  const [createBrand, { isLoading: creating }] = useCreateBrandMutation();
  const [updateBrand] = useUpdateBrandMutation();
  const [deleteBrand] = useDeleteBrandMutation();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const allItems = Array.isArray(data?.data) ? data.data : [];
  const items = allItems.filter((b) =>
    status === 'active' ? b.isActive !== false : status === 'inactive' ? b.isActive === false : true,
  );
  const meta = data?.meta;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    if (editId) {
      await updateBrand({ id: editId, body: { name: name.trim(), slug: slug.trim() } });
    } else {
      await createBrand({ name: name.trim(), slug: slug.trim() });
    }
    setShowForm(false);
    setEditId(null);
    setName('');
    setSlug('');
  };

  return (
    <div>
      <PageHeader
        title={vi.admin.brands}
        description={vi.admin.brandsDesc}
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {vi.admin.addBrand}
          </Button>
        }
      />
      <AdminStatsRow
        columns={2}
        stats={[
          { label: vi.admin.totalBrands, value: meta?.total ?? allItems.length, icon: Award },
          {
            label: vi.admin.active,
            value: allItems.filter((b) => b.isActive !== false).length,
            icon: Award,
            accent: 'success',
          },
        ]}
      />
      <AdminToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={() => push({ search: searchInput, page: '1' })}
        filterCount={status ? 1 : 0}
        onClearFilters={() => push({ status: '', page: '1' })}
        filters={
          <AdminFilterField label={vi.common.status}>
            <Select
              className="h-10"
              value={status}
              onChange={(e) => push({ status: e.target.value, page: '1' })}
            >
              <option value="">{vi.admin.all}</option>
              <option value="active">{vi.admin.active}</option>
              <option value="inactive">{vi.admin.inactive}</option>
            </Select>
          </AdminFilterField>
        }
      />
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editId ? vi.admin.edit : vi.admin.newBrand}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="grid max-w-lg gap-4 sm:grid-cols-2">
              <FormField label="Brand name">
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </FormField>
              <FormField label={vi.admin.slug}>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
              </FormField>
              <Button type="submit" disabled={creating} className="sm:col-span-2 sm:w-fit">
                {vi.admin.saveBrand}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
      <AdminDataTable<Brand>
        data={items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage={vi.common.noData}
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'slug', header: vi.admin.slug },
          {
            key: 'isActive',
            header: vi.common.status,
            render: (r) => (
              <Badge variant={r.isActive !== false ? 'success' : 'default'}>
                {r.isActive !== false ? vi.admin.active : vi.admin.inactive}
              </Badge>
            ),
          },
          {
            key: 'id',
            header: vi.common.actions,
            render: (r) => (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditId(r.id);
                    setName(r.name);
                    setSlug(r.slug);
                    setShowForm(true);
                  }}
                >
                  {vi.admin.edit}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleteId(r.id)}>
                  {vi.admin.delete}
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
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title={vi.admin.confirmDelete}
        onConfirm={async () => {
          if (deleteId) await deleteBrand(deleteId);
        }}
      />
    </div>
  );
}
