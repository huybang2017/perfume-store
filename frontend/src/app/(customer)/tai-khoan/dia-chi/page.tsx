import { Suspense } from 'react';
import { AddressesPageClient } from '@/features/account/components/AddressesPageClient';

export const dynamic = 'force-dynamic';

export default function AddressesPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-12">Loading...</div>}>
      <AddressesPageClient />
    </Suspense>
  );
}
