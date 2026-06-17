'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { ApiErrorAlert } from '@/components/common/ApiErrorAlert';
import { FormField } from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetSettingsQuery, useUpsertSettingMutation } from '@/store/api/settingApi';
import { vi } from '@/lib/i18n';

const SETTING_KEYS = {
  storeName: 'store_name',
  storeLogo: 'store_logo',
  storeEmail: 'store_email',
  storePhone: 'store_phone',
  storeAddress: 'store_address',
  paymentCod: 'payment_cod_enabled',
  paymentBank: 'payment_bank_enabled',
  paymentVnpay: 'payment_vnpay_enabled',
  paymentMomo: 'payment_momo_enabled',
  shippingFee: 'shipping_fee',
  freeShippingThreshold: 'free_shipping_threshold',
  seoTitle: 'seo_title',
  seoDescription: 'seo_description',
  seoKeywords: 'seo_keywords',
} as const;

type FormState = Record<keyof typeof SETTING_KEYS, string>;

const defaultForm: FormState = {
  storeName: '',
  storeLogo: '',
  storeEmail: '',
  storePhone: '',
  storeAddress: '',
  paymentCod: 'true',
  paymentBank: 'true',
  paymentVnpay: 'true',
  paymentMomo: 'true',
  shippingFee: '30000',
  freeShippingThreshold: '500000',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
};

export default function AdminSettingsPage() {
  const { data, isLoading, isError } = useGetSettingsQuery();
  const [upsertSetting, { isLoading: saving }] = useUpsertSettingMutation();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const settings = Array.isArray(data?.data) ? data.data : [];
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value ?? '']));
    setForm({
      storeName: map[SETTING_KEYS.storeName] ?? '',
      storeLogo: map[SETTING_KEYS.storeLogo] ?? '',
      storeEmail: map[SETTING_KEYS.storeEmail] ?? '',
      storePhone: map[SETTING_KEYS.storePhone] ?? '',
      storeAddress: map[SETTING_KEYS.storeAddress] ?? '',
      paymentCod: map[SETTING_KEYS.paymentCod] ?? 'true',
      paymentBank: map[SETTING_KEYS.paymentBank] ?? 'true',
      paymentVnpay: map[SETTING_KEYS.paymentVnpay] ?? 'true',
      paymentMomo: map[SETTING_KEYS.paymentMomo] ?? 'true',
      shippingFee: map[SETTING_KEYS.shippingFee] ?? '30000',
      freeShippingThreshold: map[SETTING_KEYS.freeShippingThreshold] ?? '500000',
      seoTitle: map[SETTING_KEYS.seoTitle] ?? '',
      seoDescription: map[SETTING_KEYS.seoDescription] ?? '',
      seoKeywords: map[SETTING_KEYS.seoKeywords] ?? '',
    });
  }, [data]);

  const set = (key: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const saveSection = async (keys: (keyof FormState)[]) => {
    for (const formKey of keys) {
      await upsertSetting({ key: SETTING_KEYS[formKey], value: form[formKey] }).unwrap();
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title={vi.admin.settings} description={vi.admin.settingsDesc} />
      {isError && <ApiErrorAlert />}
      {saved && (
        <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-800">
          {vi.common.success}: Settings saved
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{vi.admin.storeInfo}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField label="Store name">
            <Input value={form.storeName} onChange={(e) => set('storeName', e.target.value)} />
          </FormField>
          <FormField label="Logo (URL)">
            <Input value={form.storeLogo} onChange={(e) => set('storeLogo', e.target.value)} />
          </FormField>
          <FormField label={vi.auth.email}>
            <Input type="email" value={form.storeEmail} onChange={(e) => set('storeEmail', e.target.value)} />
          </FormField>
          <FormField label={vi.account.phone}>
            <Input value={form.storePhone} onChange={(e) => set('storePhone', e.target.value)} />
          </FormField>
          <FormField label="Address" className="sm:col-span-2">
            <Input value={form.storeAddress} onChange={(e) => set('storeAddress', e.target.value)} />
          </FormField>
          <Button
            disabled={saving}
            onClick={() =>
              saveSection(['storeName', 'storeLogo', 'storeEmail', 'storePhone', 'storeAddress'])
            }
          >
            {saving ? vi.common.saving : vi.common.save}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{vi.admin.paymentSettings}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ['paymentCod', vi.payment.methods.cod],
              ['paymentBank', vi.payment.methods.bank],
              ['paymentVnpay', vi.payment.methods.vnpay],
              ['paymentMomo', vi.payment.methods.momo],
            ] as const
          ).map(([key, label]) => (
            <FormField key={key} label={label}>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
              >
                <option value="true">{vi.common.yes}</option>
                <option value="false">{vi.common.no}</option>
              </select>
            </FormField>
          ))}
          <Button
            className="sm:col-span-2 sm:w-fit"
            disabled={saving}
            onClick={() => saveSection(['paymentCod', 'paymentBank', 'paymentVnpay', 'paymentMomo'])}
          >
            {vi.common.save}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{vi.admin.shippingSettings}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField label={vi.admin.shippingFee}>
            <Input type="number" value={form.shippingFee} onChange={(e) => set('shippingFee', e.target.value)} />
          </FormField>
          <FormField label={vi.admin.freeShippingThreshold}>
            <Input
              type="number"
              value={form.freeShippingThreshold}
              onChange={(e) => set('freeShippingThreshold', e.target.value)}
            />
          </FormField>
          <Button
            disabled={saving}
            onClick={() => saveSection(['shippingFee', 'freeShippingThreshold'])}
          >
            {vi.common.save}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{vi.admin.seoSettings}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="SEO title">
            <Input value={form.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} />
          </FormField>
          <FormField label="SEO description">
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={form.seoDescription}
              onChange={(e) => set('seoDescription', e.target.value)}
              rows={3}
            />
          </FormField>
          <FormField label="Keywords">
            <Input value={form.seoKeywords} onChange={(e) => set('seoKeywords', e.target.value)} placeholder="fashion, t-shirts..." />
          </FormField>
          <Button
            disabled={saving}
            onClick={() => saveSection(['seoTitle', 'seoDescription', 'seoKeywords'])}
          >
            {vi.common.save}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
