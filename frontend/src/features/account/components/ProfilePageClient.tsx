'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { FormField } from '@/components/common/FormField';
import { ApiErrorAlert } from '@/components/common/ApiErrorAlert';
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
} from '@/store/api/authApi';
import { AccountLayout } from './AccountLayout';
import { vi } from '@/lib/i18n';

type FormData = {
  fullName: string;
  phone: string;
  email: string;
};

export function ProfilePageClient() {
  const { data, isLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: saving, isSuccess, isError }] =
    useUpdateProfileMutation();
  const user = data?.data;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName,
        phone: user.phone ?? '',
        email: user.email,
      });
    }
  }, [user, reset]);

  const onSubmit = async (values: FormData) => {
    await updateProfile({
      fullName: values.fullName,
      phone: values.phone || undefined,
    });
  };

  if (isLoading) {
    return (
      <AccountLayout title={vi.account.profile}>
        <div className="h-48 animate-pulse rounded-sm bg-surface" />

      </AccountLayout>
    );
  }

  return (
    <AccountLayout title={vi.account.profile}>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
            <FormField label={vi.auth.email}>
              <Input {...register('email')} disabled className="bg-slate-50" />
            </FormField>
            <FormField label={vi.auth.fullName} error={errors.fullName?.message}>
              <Input {...register('fullName', { required: true })} />
            </FormField>
            <FormField label={vi.account.phone} error={errors.phone?.message}>
              <Input {...register('phone')} placeholder="0901234567" />
            </FormField>
            {isSuccess && (
              <p className="text-sm text-green-600">{vi.account.profileSaved}</p>
            )}
            {isError && <ApiErrorAlert />}
            <Button type="submit" disabled={saving}>
              {saving ? vi.common.saving : vi.common.save}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AccountLayout>
  );
}
