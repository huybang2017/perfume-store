'use client';

import { useParams, usePathname } from 'next/navigation';
import { CustomerAuthGuard } from '@/components/guards/CustomerAuthGuard';
import { OrderDetailView } from '@/features/orders/components/OrderDetailView';
export default function MyOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();

  return (
    <CustomerAuthGuard redirectTo={pathname}>
      <OrderDetailView orderId={id} />
    </CustomerAuthGuard>
  );
}
