import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string | number | undefined;
  icon: LucideIcon;
  trend?: string;
  isLoading?: boolean;
  accent?: 'primary' | 'success' | 'warning' | 'neutral';
}

const accentStyles = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  neutral: 'bg-surface text-text-secondary ring-1 ring-border',
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  isLoading,
  accent = 'primary',
}: KpiCardProps) {
  return (
    <Card className="hover:shadow-[var(--shadow-md)]">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium text-text-secondary">{label}</p>
            {isLoading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <p className="text-3xl font-semibold tracking-tight text-text-primary">
                {value ?? '—'}
              </p>
            )}
            {trend && !isLoading && (
              <p className="text-xs text-text-muted">{trend}</p>
            )}
          </div>
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-xl',
              accentStyles[accent],
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
