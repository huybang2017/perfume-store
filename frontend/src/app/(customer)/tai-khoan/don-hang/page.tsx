import { Suspense } from 'react';
import { MyOrdersPageClient } from '@/features/orders/components/MyOrdersPageClient';
import { OrderListSkeleton } from '@/features/orders/components/OrderListSkeleton';

export default function MyOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-12">
          <OrderListSkeleton count={3} />
        </div>
      }
    >
      <MyOrdersPageClient />
    </Suspense>
  );
}
