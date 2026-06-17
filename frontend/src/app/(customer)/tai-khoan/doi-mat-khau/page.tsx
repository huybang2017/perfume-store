import { Suspense } from 'react';
import { ChangePasswordPageClient } from '@/features/account/components/ChangePasswordPageClient';

export const dynamic = 'force-dynamic';

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-12">Loading...</div>}>
      <ChangePasswordPageClient />
    </Suspense>
  );
}
