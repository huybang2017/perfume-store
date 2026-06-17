'use client';

import { LucideIcon } from 'lucide-react';
import { KpiCard } from '@/components/common/KpiCard';

export interface StatItem {
  label: string;
  value: string | number | undefined;
  icon: LucideIcon;
  accent?: 'primary' | 'success' | 'warning' | 'neutral';
}

interface AdminStatsRowProps {
  stats: StatItem[];
  isLoading?: boolean;
  columns?: 1 | 2 | 3 | 4 | 5;
}

export function AdminStatsRow({
  stats,
  isLoading,
  columns = 4,
}: AdminStatsRowProps) {
  const grid =
    columns === 1
      ? 'sm:grid-cols-1 max-w-sm'
      : columns === 5
      ? 'sm:grid-cols-2 xl:grid-cols-5'
      : columns === 3
        ? 'sm:grid-cols-3'
        : columns === 2
          ? 'sm:grid-cols-2'
          : 'sm:grid-cols-2 xl:grid-cols-4';

  return (
    <div className={`mb-6 grid gap-4 ${grid}`}>
      {stats.map((s) => (
        <KpiCard
          key={s.label}
          label={s.label}
          value={s.value}
          icon={s.icon}
          accent={s.accent}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
