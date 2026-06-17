'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Plus, Ticket } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import {
  AdminDataTable,
  AdminPagination,
  AdminStatsRow,
  AdminFilterField,
  AdminToolbar,
  ConfirmDialog,
} from '@/components/admin';
import { FormField } from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useCreateVoucherMutation,
  useDeleteVoucherMutation,
  useGetVoucherStatsQuery,
  useGetVouchersQuery,
  useUpdateVoucherMutation,
} from '@/store/api/voucherApi';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Voucher } from '@/types/api';
import { formatVoucherValue, vi } from '@/lib/i18n';

const schema = z.object({
  code: z.string().min(3),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().min(0),
  description: z.string().optional(),
  minOrderAmount: z.number().optional(),
  maxDiscount: z.number().optional(),
  usageLimit: z.number().optional(),
});

type FormData = z.infer<typeof schema>;

export function AdminVouchersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Number(searchParams.get('limit')) || 10;
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const sort = searchParams.get('sort') ?? 'newest';

  const [searchInput, setSearchInput] = useState(search);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const push = (patch: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    if (!patch.page) p.delete('page');
    router.push(`?${p.toString()}`, { scroll: false });
  };

  const sortOrder = sort === 'oldest' ? 'asc' : 'desc';
  const { data: statsData, isLoading: statsLoading } = useGetVoucherStatsQuery();
  const { data, isLoading, isError } = useGetVouchersQuery({
    page,
    limit,
    search: search || undefined,
    isActive: status === 'active' ? true : status === 'inactive' ? false : undefined,
    sortBy: 'createdAt',
    sortOrder,
  });
  const [createVoucher, { isLoading: creating }] = useCreateVoucherMutation();
  const [updateVoucher] = useUpdateVoucherMutation();
  const [deleteVoucher] = useDeleteVoucherMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ defaultValues: { type: 'percentage', code: '', value: 10 } });

  const vouchers = Array.isArray(data?.data) ? data.data : [];
  const meta = data?.meta;

  const openEdit = (voucher: Voucher) => {
    setEditId(voucher.id);
    reset({
      code: voucher.code,
      type: voucher.type,
      value: voucher.value,
      description: voucher.description ?? '',
      minOrderAmount: voucher.minOrderAmount ?? undefined,
      maxDiscount: voucher.maxDiscount ?? undefined,
      usageLimit: voucher.usageLimit ?? undefined,
    });
    setShowForm(true);
  };

  const onSubmit = async (raw: FormData) => {
    const parsed = schema.safeParse({
      ...raw,
      value: Number(raw.value),
      minOrderAmount: raw.minOrderAmount ? Number(raw.minOrderAmount) : undefined,
      maxDiscount: raw.maxDiscount ? Number(raw.maxDiscount) : undefined,
      usageLimit: raw.usageLimit ? Number(raw.usageLimit) : undefined,
    });
    if (!parsed.success) return;
    if (editId) {
      await updateVoucher({ id: editId, body: parsed.data });
    } else {
      await createVoucher(parsed.data).unwrap();
    }
    reset();
    setShowForm(false);
    setEditId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={vi.admin.vouchers}
        description={vi.admin.vouchersDesc}
        action={
          <Button onClick={() => { setEditId(null); reset(); setShowForm(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            {vi.admin.createVoucher}
          </Button>
        }
      />

      <AdminStatsRow
        isLoading={statsLoading}
        columns={3}
        stats={[
          { label: vi.admin.activeVouchers, value: statsData?.data?.active, icon: Ticket, accent: 'success' },
          { label: vi.admin.expiredVouchers, value: statsData?.data?.expired, icon: Ticket, accent: 'warning' },
          { label: vi.admin.usedVouchers, value: statsData?.data?.used, icon: Ticket },
        ]}
      />

      <AdminToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={() => push({ search: searchInput, page: '1' })}
        searchPlaceholder="Code, voucher name..."
        sortValue={sort}
        sortOptions={[
          { value: 'newest', label: vi.admin.sortNewest },
          { value: 'oldest', label: vi.admin.sortOldest },
        ]}
        onSortChange={(v) => push({ sort: v, page: '1' })}
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
        <Card>
          <CardHeader>
            <CardTitle>{editId ? vi.admin.edit : vi.admin.newVoucher}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
              <FormField label={vi.admin.code} error={errors.code?.message}>
                <Input placeholder="GIAM10" {...register('code')} disabled={!!editId} />
              </FormField>
              <FormField label={vi.admin.type}>
                <Select {...register('type')}>
                  <option value="percentage">{vi.admin.percentage}</option>
                  <option value="fixed">{vi.admin.fixed}</option>
                </Select>
              </FormField>
              <FormField label={vi.admin.value}>
                <Input type="number" {...register('value', { valueAsNumber: true })} />
              </FormField>
              <FormField label={vi.admin.description}>
                <Input {...register('description')} />
              </FormField>
              <FormField label={vi.admin.minOrder}>
                <Input type="number" {...register('minOrderAmount', { valueAsNumber: true })} />
              </FormField>
              <FormField label={vi.admin.maxDiscount}>
                <Input type="number" {...register('maxDiscount', { valueAsNumber: true })} />
              </FormField>
              <Button type="submit" disabled={creating} className="sm:col-span-2 sm:w-fit">
                {creating ? vi.common.saving : vi.common.save}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <AdminDataTable<Voucher>
        data={vouchers}
        isLoading={isLoading}
        isError={isError}
        emptyMessage={vi.common.noData}
        columns={[
          {
            key: 'code',
            header: vi.admin.code,
            render: (r) => <span className="font-mono font-medium">{r.code}</span>,
          },
          { key: 'type', header: vi.admin.type },
          {
            key: 'value',
            header: vi.admin.value,
            render: (r) => formatVoucherValue(r.type, r.value),
          },
          {
            key: 'usedCount',
            header: vi.admin.usage,
            render: (r) => `${r.usedCount ?? 0}${r.usageLimit ? ` / ${r.usageLimit}` : ''}`,
          },
          {
            key: 'isActive',
            header: vi.common.status,
            render: (r) => (
              <Badge variant={r.isActive ? 'success' : 'default'}>
                {r.isActive ? vi.admin.active : vi.admin.inactive}
              </Badge>
            ),
          },
          {
            key: 'id',
            header: vi.common.actions,
            render: (r) => (
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
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
          if (deleteId) await deleteVoucher(deleteId);
        }}
      />
    </div>
  );
}
