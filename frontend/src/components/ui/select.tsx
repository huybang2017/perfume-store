import * as React from 'react';
import { cn } from '@/lib/utils';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }
>(({ className, error, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'flex h-10 w-full appearance-none rounded-xl border bg-white px-3.5 py-2 text-sm text-text-primary shadow-sm transition-all duration-200',
      'hover:border-text-muted/40 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
      error ? 'border-danger' : 'border-border',
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';
