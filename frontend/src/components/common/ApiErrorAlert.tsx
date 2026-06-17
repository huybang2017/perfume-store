import { AlertCircle } from 'lucide-react';
import { vi } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface ApiErrorAlertProps {
  message?: string;
  className?: string;
}

export function ApiErrorAlert({
  message = vi.common.apiError,
  className = '',
}: ApiErrorAlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800',
        className,
      )}
    >
      <AlertCircle className="h-5 w-5 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
