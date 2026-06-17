import { Suspense } from 'react';
import { ProfilePageClient } from '@/features/account/components/ProfilePageClient';

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-12">Loading...</div>}>
      <ProfilePageClient />
    </Suspense>
  );
}
