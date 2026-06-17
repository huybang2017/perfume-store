'use client';

import { Check } from 'lucide-react';
import { formatDateTime, vi } from '@/lib/i18n';
import { orderStatusConfig } from '@/lib/design';
import type { OrderStatus, OrderStatusHistoryEntry } from '@/types/api';
import { cn } from '@/lib/utils';

interface OrderTrackingTimelineProps {
  status: OrderStatus;
  statusHistory?: OrderStatusHistoryEntry[];
  paymentStatus?: string;
}

export function OrderTrackingTimeline({
  status,
  statusHistory = [],
  paymentStatus,
}: OrderTrackingTimelineProps) {
  if (status === 'cancelled') {
    const entries = statusHistory.length
      ? statusHistory
      : [{ status: 'cancelled' as const, createdAt: new Date().toISOString(), note: vi.order.cancelled }];

    return (
      <ol className="space-y-0">
        {entries.map((entry, index) => {
          const config = orderStatusConfig[entry.status];
          const isLast = index === entries.length - 1;
          return (
            <li key={`${entry.status}-${index}`} className="relative flex gap-4 pb-8 last:pb-0">
              {!isLast && (
                <span className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-0.5 bg-slate-200" />
              )}
              <span
                className={cn(
                  'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  entry.status === 'cancelled'
                    ? 'bg-red-600 text-white'
                    : 'bg-blue-600 text-white',
                )}
              >
                <Check className="h-4 w-4" />
              </span>
              <div className="pt-0.5">
                <p className="text-sm font-medium text-slate-900">
                  {entry.note ?? config.label}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatDateTime(entry.createdAt)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  const history =
    statusHistory.length > 0
      ? statusHistory
      : [];

  let steps: OrderStatusHistoryEntry[] =
    history.length > 0
      ? [...history]
      : [];

  if (paymentStatus === 'paid' && steps.length) {
    const hasPaid = steps.some((s) => (s as { note?: string }).note?.includes('Payment'));
    if (!hasPaid) {
      const confirmedIdx = steps.findIndex((s) => s.status === 'confirmed');
      const paidEntry: OrderStatusHistoryEntry = {
        status: 'confirmed',
        createdAt: steps[confirmedIdx >= 0 ? confirmedIdx : 0]?.createdAt ?? new Date().toISOString(),
        note: vi.payment.timeline.paid,
      };
      if (confirmedIdx >= 0) {
        steps = [
          ...steps.slice(0, confirmedIdx),
          paidEntry,
          ...steps.slice(confirmedIdx),
        ];
      } else {
        steps = [steps[0], paidEntry, ...steps.slice(1)].filter(Boolean) as OrderStatusHistoryEntry[];
      }
    }
  }

  if (!steps.length) {
    return null;
  }

  const currentStatus = status;

  return (
    <ol className="space-y-0">
      {steps.map((entry, index) => {
        const stepIndex = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'].indexOf(
          entry.status,
        );
        const currentIndex = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'].indexOf(
          currentStatus,
        );
        const done = stepIndex <= currentIndex;
        const active = entry.status === currentStatus;
        const config = orderStatusConfig[entry.status];
        const isLast = index === steps.length - 1;

        return (
          <li key={`${entry.status}-${index}`} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <span
                className={cn(
                  'absolute left-[15px] top-8 h-[calc(100%-8px)] w-0.5',
                  done ? 'bg-blue-300' : 'bg-slate-200',
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
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
                {entry.note ?? config.label}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatDateTime(entry.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
