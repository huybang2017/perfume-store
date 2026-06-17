'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import { vi } from '@/lib/i18n';

export function CustomerAuthGuard({
  children,
  redirectTo,
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const router = useRouter();
  const { isAuthenticated, token } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated && !token) {
      const login = `${ROUTES.auth.login}?redirect=${encodeURIComponent(redirectTo ?? ROUTES.cart)}`;
      router.replace(login);
    }
  }, [mounted, isAuthenticated, token, router, redirectTo]);

  if (!mounted) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-600">
        {vi.common.loading}
      </div>
    );
  }

  if (!isAuthenticated && !token) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-600">
        {vi.guard.redirectSignIn}
      </div>
    );
  }

  return <>{children}</>;
}
