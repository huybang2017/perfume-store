import { Check } from 'lucide-react';
import { orderTimelineSteps, orderStatusConfig } from '@/lib/design';
import { vi } from '@/lib/i18n';
import type { OrderStatus } from '@/types/api';
import { cn } from '@/lib/utils';

interface OrderTimelineProps {
  status: OrderStatus;
}

export function OrderTimeline({ status }: OrderTimelineProps) {
  if (status === 'cancelled') {
    return (
      <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
        {vi.order.cancelled}
      </p>
    );
  }

  const currentIndex = orderTimelineSteps.indexOf(status);

  return (
    <ol className="space-y-0">
      {orderTimelineSteps.map((step, index) => {
        const done = index <= currentIndex;
        const active = index === currentIndex;
        const config = orderStatusConfig[step];

        return (
          <li key={step} className="relative flex gap-4 pb-8 last:pb-0">
            {index < orderTimelineSteps.length - 1 && (
              <span
                className={cn(
                  'absolute left-[15px] top-8 h-[calc(100%-8px)] w-0.5',
                  done ? 'bg-blue-300' : 'bg-slate-200',
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                done
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-400 ring-1 ring-slate-200',
                active && 'ring-2 ring-blue-300',
              )}
            >
              {done ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <div className="pt-0.5">
              <p
                className={cn(
                  'text-sm font-medium',
                  done ? 'text-slate-900' : 'text-slate-400',
                )}
              >
                {config.label}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
