'use client';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface AdminFilterFieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
  controlClassName?: string;
}

export function AdminFilterField({
  label,
  children,
  className,
  labelClassName,
  controlClassName,
}: AdminFilterFieldProps) {
  return (
    <div
      className={cn(
        'admin-filter-field flex min-w-0 flex-col gap-1.5',
        className,
      )}
    >
      <Label
        className={cn(
          'shrink-0 text-xs font-medium text-slate-500',
          labelClassName,
        )}
      >
        {label}
      </Label>
      <div className={cn('w-full min-w-[8.75rem]', controlClassName)}>
        {children}
      </div>
    </div>
  );
}
