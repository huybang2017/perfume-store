'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { FormField } from '@/components/common/FormField';
import { useRegisterMutation } from '@/store/api/authApi';
import { setCredentials } from '@/store/slices/authSlice';
import { ROUTES } from '@/constants/routes';
import { vi } from '@/lib/i18n';

const schema = z
  .object({
    fullName: z.string().min(2, vi.auth.nameMin2),
    email: z.string().email(vi.auth.invalidEmail),
    password: z.string().min(8, vi.auth.passwordMin8),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: vi.auth.passwordMismatch,
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [registerUser, { isLoading, isError }] = useRegisterMutation();
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
      const res = await registerUser({
        email: parsed.data.email,
        password: parsed.data.password,
        fullName: parsed.data.fullName,
      }).unwrap();

      if (res.success && res.data) {
        dispatch(
          setCredentials({
            user: res.data.user,
            token: res.data.accessToken,
            refreshToken: res.data.refreshToken,
          }),
        );
        router.push(ROUTES.home);
      }
    } catch {
      setError('email', { message: vi.auth.registerFailed });
    }
  };

  return (
    <Card className="shadow-md">
      <CardContent className="p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField label={vi.auth.fullName} error={errors.fullName?.message}>
            <Input placeholder="John Doe" error={!!errors.fullName} {...register('fullName')} />
          </FormField>
          <FormField label={vi.auth.email} error={errors.email?.message}>
            <Input
              type="email"
              placeholder="ban@example.com"
              error={!!errors.email}
              {...register('email')}
            />
          </FormField>
          <FormField
            label={vi.auth.password}
            hint={vi.auth.passwordHint}
            error={errors.password?.message}
          >
            <Input type="password" error={!!errors.password} {...register('password')} />
          </FormField>
          <FormField label={vi.auth.confirmPassword} error={errors.confirmPassword?.message}>
            <Input type="password" error={!!errors.confirmPassword} {...register('confirmPassword')} />
          </FormField>
          {isError && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {vi.auth.registerFailed}
            </p>
          )}
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? vi.auth.creatingAccount : vi.auth.createAccount}
          </Button>
          <p className="text-center text-sm text-text-secondary">
            {vi.auth.hasAccount}{' '}
            <Link href={ROUTES.auth.login} className="font-semibold text-primary hover:underline">
              {vi.common.signIn}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
