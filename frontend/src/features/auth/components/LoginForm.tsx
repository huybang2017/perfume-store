'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { FormField } from '@/components/common/FormField';
import { useLoginMutation } from '@/store/api/authApi';
import { setCredentials } from '@/store/slices/authSlice';
import { vi } from '@/lib/i18n';
import { ROUTES } from '@/constants/routes';

const schema = z.object({
  email: z.string().email(vi.auth.invalidEmail),
  password: z.string().min(6, vi.auth.passwordMin6),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const [login, { isLoading, isError }] = useLoginMutation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = async (raw: FormData) => {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FormData;
        if (field) setError(field, { message: issue.message });
      });
      return;
    }

    try {
      const res = await login(parsed.data).unwrap();
      if (res.success && res.data) {
        dispatch(
          setCredentials({
            user: res.data.user,
            token: res.data.accessToken,
            refreshToken: res.data.refreshToken,
          }),
        );

        const redirect = searchParams.get('redirect');
        const isStaff =
          res.data.user.role === 'admin' || res.data.user.role === 'staff';

        if (redirect && (isStaff || !redirect.startsWith('/admin'))) {
          router.push(redirect);
        } else if (isStaff) {
          router.push(ROUTES.admin.dashboard);
        } else {
          router.push(ROUTES.home);
        }
      }
    } catch {
      setError('password', { message: vi.auth.invalidCredentials });
    }
  };

  return (
    <Card className="shadow-md">
      <CardContent className="p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField label={vi.auth.email} error={errors.email?.message}>
            <Input
              type="email"
              placeholder="ban@example.com"
              error={!!errors.email}
              {...register('email')}
            />
          </FormField>
          <FormField label={vi.auth.password} error={errors.password?.message}>
            <Input
              type="password"
              placeholder="••••••••"
              error={!!errors.password}
              {...register('password')}
            />
          </FormField>
          {isError && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {vi.auth.invalidCredentials}
            </p>
          )}
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? vi.auth.signingIn : vi.common.signIn}
          </Button>
          <p className="text-center text-sm text-text-secondary">
            {vi.auth.newHere}{' '}
            <Link href={ROUTES.auth.register} className="font-semibold text-primary hover:underline">
              {vi.auth.createAccount}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
