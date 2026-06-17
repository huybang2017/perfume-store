'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { FormField } from '@/components/common/FormField';
import { useChangePasswordMutation } from '@/store/api/authApi';
import { AccountLayout } from './AccountLayout';
import { vi } from '@/lib/i18n';

type FormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function ChangePasswordPageClient() {
  const [changePassword, { isLoading, isSuccess, isError }] =
    useChangePasswordMutation();
  const { register, handleSubmit, reset, formState: { errors }, setError } =
    useForm<FormData>();

  const onSubmit = async (values: FormData) => {
    if (values.newPassword !== values.confirmPassword) {
      setError('confirmPassword', { message: vi.auth.passwordMismatch });
      return;
    }
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }).unwrap();
      reset();
    } catch {
      setError('currentPassword', { message: vi.account.wrongPassword });
    }
  };

  return (
    <AccountLayout title={vi.account.changePassword}>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
            <FormField
              label={vi.account.currentPassword}
              error={errors.currentPassword?.message}
            >
              <Input type="password" {...register('currentPassword', { required: true })} />
            </FormField>
            <FormField label={vi.account.newPassword} error={errors.newPassword?.message}>
              <Input
                type="password"
                {...register('newPassword', { required: true, minLength: 8 })}
              />
            </FormField>
            <FormField
              label={vi.auth.confirmPassword}
              error={errors.confirmPassword?.message}
            >
              <Input type="password" {...register('confirmPassword', { required: true })} />
            </FormField>
            {isSuccess && (
              <p className="text-sm text-green-600">{vi.account.passwordChanged}</p>
            )}
            {isError && !errors.currentPassword && (
              <p className="text-sm text-red-600">{vi.common.error}</p>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? vi.common.saving : vi.account.changePassword}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AccountLayout>
  );
}
