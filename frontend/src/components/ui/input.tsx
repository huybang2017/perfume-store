import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }
>(({ className, type, error, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'flex h-10 w-full rounded-xl border bg-white px-3.5 py-2 text-sm text-text-primary shadow-sm transition-all duration-200 placeholder:text-text-muted',
      'hover:border-text-muted/40 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
      error ? 'border-danger focus-visible:ring-danger/20' : 'border-border',
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = 'Input';
