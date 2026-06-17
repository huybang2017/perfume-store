import { Suspense } from 'react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { Skeleton } from '@/components/ui/skeleton';
import { vi } from '@/lib/i18n';

export default function LoginPage() {
  return (
    <AuthLayout title={vi.auth.welcomeBack} subtitle={vi.auth.signInSubtitle}>
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
