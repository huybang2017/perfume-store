import { Badge } from '@/components/ui/badge';
import { orderStatusConfig } from '@/lib/design';
import type { OrderStatus } from '@/types/api';

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = orderStatusConfig[status];
  return (
    <Badge
      variant={config.variant}
      className={config.className}
    >
      {config.label}
    </Badge>
  );
}
