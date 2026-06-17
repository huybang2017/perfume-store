'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import { vi } from '@/lib/i18n';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isAdmin, user, token } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated && !token) {
      router.replace(`${ROUTES.auth.login}?redirect=${ROUTES.admin.dashboard}`);
      return;
    }
    if (user && !isAdmin) {
      router.replace(ROUTES.home);
    }
  }, [mounted, isAuthenticated, isAdmin, user, token, router]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-sm text-slate-600">
        {vi.common.loading}
      </div>
    );
  }

  if (!isAuthenticated && !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-sm text-slate-600">
        {vi.admin.checkingAccess}
      </div>
    );
  }

  if (user && !isAdmin) {
    return null;
  }

  if ((isAuthenticated || token) && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-sm text-slate-600">
        {vi.common.loading}
      </div>
    );
  }

  return <>{children}</>;
}
