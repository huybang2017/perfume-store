'use client';

import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import {
  AdminDataTable,
  AdminPagination,
  AdminStatsRow,
  AdminFilterField,
  AdminToolbar,
} from '@/components/admin';
import { FormField } from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useCreateUserMutation,
  useGetUserStatsQuery,
  useGetUsersQuery,
  useUpdateUserMutation,
} from '@/store/api/userApi';
import { useRouter, useSearchParams } from 'next/navigation';
import { vi } from '@/lib/i18n';
import type { User } from '@/types/api';

export function AdminCustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Number(searchParams.get('limit')) || 10;
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';

  const [searchInput, setSearchInput] = useState(search);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
  });

  const push = (patch: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    if (!patch.page) p.delete('page');
    router.push(`?${p.toString()}`, { scroll: false });
  };

  const { data: statsData, isLoading: statsLoading } = useGetUserStatsQuery({ role: 'customer' });
  const { data, isLoading, isError } = useGetUsersQuery({
    page,
    limit,
    search: search || undefined,
    role: 'customer',
    isActive: status === 'active' ? true : status === 'inactive' ? false : undefined,
  });
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();

  const customers = Array.isArray(data?.data) ? data.data : [];
  const meta = data?.meta;

  const resetForm = () => {
    setForm({ email: '', password: '', fullName: '', phone: '' });
    setEditUser(null);
    setShowForm(false);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({
      email: u.email,
      password: '',
      fullName: u.fullName,
      phone: u.phone ?? '',
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editUser) {
      await updateUser({
        id: editUser.id,
        body: {
          fullName: form.fullName.trim(),
          phone: form.phone.trim() || undefined,
        },
      });
    } else {
      if (!form.email || !form.password || !form.fullName) return;
      await createUser({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        role: 'customer',
      });
    }
    resetForm();
  };

  return (
    <div>
      <PageHeader
        title={vi.admin.customers}
        description={vi.admin.customersDesc}
        action={
          <Button onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            {vi.admin.addNew}
          </Button>
        }
      />

      <AdminStatsRow
        isLoading={statsLoading}
        columns={3}
        stats={[
          { label: vi.admin.totalCustomers, value: statsData?.data?.total, icon: Users },
          {
            label: vi.admin.activeCustomers,
            value: statsData?.data?.active,
            icon: Users,
            accent: 'success',
          },
          { label: vi.admin.newCustomers, value: statsData?.data?.newCustomers, icon: Users },
        ]}
      />

      <AdminToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={() => push({ search: searchInput, page: '1' })}
        searchPlaceholder="Name, email, phone..."
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
            <CardTitle>{editUser ? vi.admin.edit : vi.admin.addNew}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="grid max-w-lg gap-4 sm:grid-cols-2">
              {!editUser && (
                <>
                  <FormField label={vi.auth.email}>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </FormField>
                  <FormField label={vi.auth.password}>
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    />
                  </FormField>
                </>
              )}
              <FormField label={vi.auth.fullName}>
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                />
              </FormField>
              <FormField label={vi.account.phone}>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </FormField>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={creating}>
                  {vi.common.save}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  {vi.common.cancel}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <AdminDataTable<User>
        data={customers}
        isLoading={isLoading}
        isError={isError}
        emptyMessage={vi.admin.noCustomers}
        columns={[
          { key: 'fullName', header: vi.auth.fullName },
          { key: 'email', header: vi.auth.email },
          { key: 'phone', header: vi.account.phone },
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
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                  {vi.admin.edit}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    updateUser({
                      id: r.id,
                      body: { isActive: !r.isActive },
                    })
                  }
                >
                  {r.isActive ? vi.admin.disable : vi.admin.enable}
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
