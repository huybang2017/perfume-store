import type { OrderStatus } from '@/types/api';
import { vi } from '@/lib/i18n';

export const orderStatusConfig: Record<
  OrderStatus,
  {
    label: string;
    variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
    className?: string;
  }
> = {
  pending: {
    label: vi.order.statuses.pending,
    variant: 'warning',
    className: 'bg-amber-100 text-amber-800 ring-amber-200',
  },
  confirmed: {
    label: vi.order.statuses.confirmed,
    variant: 'info',
    className: 'bg-blue-100 text-blue-800 ring-blue-200',
  },
  processing: {
    label: vi.order.statuses.processing,
    variant: 'default',
    className: 'bg-violet-100 text-violet-800 ring-violet-200',
  },
  shipped: {
    label: vi.order.statuses.shipped,
    variant: 'warning',
    className: 'bg-orange-100 text-orange-800 ring-orange-200',
  },
  delivered: {
    label: vi.order.statuses.delivered,
    variant: 'success',
    className: 'bg-green-100 text-green-800 ring-green-200',
  },
  cancelled: {
    label: vi.order.statuses.cancelled,
    variant: 'danger',
    className: 'bg-red-100 text-red-800 ring-red-200',
  },
};

export const orderTimelineSteps: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
];

export function stockBadge(stock: number) {
  if (stock <= 0) return { label: vi.product.outOfStock, variant: 'danger' as const };
  if (stock <= 10) return { label: vi.product.lowStock, variant: 'warning' as const };
  return { label: vi.product.inStock, variant: 'success' as const };
}
