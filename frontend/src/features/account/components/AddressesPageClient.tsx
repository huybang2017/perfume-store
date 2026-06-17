'use client';

import { useState } from 'react';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { FormField } from '@/components/common/FormField';
import { Badge } from '@/components/ui/badge';
import {
  useGetAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} from '@/store/api/accountApi';
import type { UserAddress } from '@/types/api';
import { AccountLayout } from './AccountLayout';
import { vi } from '@/lib/i18n';

const emptyForm = {
  label: '',
  fullName: '',
  phone: '',
  province: '',
  district: '',
  ward: '',
  street: '',
  isDefault: false,
};

export function AddressesPageClient() {
  const { data, isLoading } = useGetAddressesQuery();
  const [createAddress, { isLoading: creating }] = useCreateAddressMutation();
  const [updateAddress, { isLoading: updating }] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const addresses = data?.data ?? [];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (addr: UserAddress) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label ?? '',
      fullName: addr.fullName,
      phone: addr.phone,
      province: addr.province,
      district: addr.district,
      ward: addr.ward,
      street: addr.street,
      isDefault: addr.isDefault,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (editingId) {
      await updateAddress({ id: editingId, ...form });
    } else {
      await createAddress(form);
    }
    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const formatAddress = (a: UserAddress) =>
    `${a.street}, ${a.ward}, ${a.district}, ${a.province}`;

  return (
    <AccountLayout title={vi.account.addressBook}>
      <div className="space-y-4">
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {vi.account.addAddress}
        </Button>

        {showForm && (
          <Card>
            <CardContent className="space-y-3 p-6">
              <h3 className="font-medium text-slate-900">
                {editingId ? vi.account.editAddress : vi.account.addAddress}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label={vi.account.addressLabel}>
                  <Input
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    placeholder={vi.account.addressLabelPlaceholder}
                  />
                </FormField>
                <FormField label={vi.auth.fullName}>
                  <Input
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  />
                </FormField>
                <FormField label={vi.account.phone}>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </FormField>
                <FormField label={vi.account.province}>
                  <Input
                    value={form.province}
                    onChange={(e) => setForm({ ...form, province: e.target.value })}
                  />
                </FormField>
                <FormField label={vi.account.district}>
                  <Input
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                  />
                </FormField>
                <FormField label={vi.account.ward}>
                  <Input
                    value={form.ward}
                    onChange={(e) => setForm({ ...form, ward: e.target.value })}
                  />
                </FormField>
                <div className="sm:col-span-2">
                <FormField label={vi.account.street}>
                  <Input
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                  />
                </FormField>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="h-4 w-4 rounded"
                />
                {vi.account.setDefault}
              </label>
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={creating || updating}
                >
                  {vi.common.save}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  {vi.common.cancel}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="h-32 animate-pulse rounded-sm bg-surface" />
        ) : addresses.length === 0 ? (
          <p className="text-text-secondary font-serif italic">{vi.account.noAddresses}</p>
        ) : (
          <ul className="space-y-3">
            {addresses.map((addr) => (
              <li
                key={addr.id}
                className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-900">
                        {addr.fullName}
                      </span>
                      {addr.label && (
                        <span className="text-sm text-slate-500">({addr.label})</span>
                      )}
                      {addr.isDefault && (
                        <Badge variant="default">{vi.account.defaultBadge}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">{addr.phone}</p>
                    <p className="mt-1 text-sm text-slate-600">{formatAddress(addr)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(addr)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAddress(addr.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AccountLayout>
  );
}
