'use client';

import { Package, Truck, CheckCircle2, XCircle, ShoppingBag } from 'lucide-react';
import { KpiCard } from '@/components/common/KpiCard';
import { vi } from '@/lib/i18n';
import type { OrderStats } from '@/types/api';

interface OrderStatsCardsProps {
  stats?: OrderStats;
  isLoading?: boolean;
}

export function OrderStatsCards({ stats, isLoading }: OrderStatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <KpiCard
        label={vi.order.statsTotal}
        value={stats?.total}
        icon={ShoppingBag}
        isLoading={isLoading}
        accent="primary"
      />
      <KpiCard
        label={vi.order.statsProcessing}
        value={stats?.processing}
        icon={Package}
        isLoading={isLoading}
        accent="neutral"
      />
      <KpiCard
        label={vi.order.statsShipping}
        value={stats?.shipping}
        icon={Truck}
        isLoading={isLoading}
        accent="warning"
      />
      <KpiCard
        label={vi.order.statsCompleted}
        value={stats?.completed}
        icon={CheckCircle2}
        isLoading={isLoading}
        accent="success"
      />
      <KpiCard
        label={vi.order.statsCancelled}
        value={stats?.cancelled}
        icon={XCircle}
        isLoading={isLoading}
        accent="warning"
      />
    </div>
  );
}
