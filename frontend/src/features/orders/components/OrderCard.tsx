'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { OrderStatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, formatVND, vi } from '@/lib/i18n';
import { resolveProductImage } from '@/lib/product-images';
import { ROUTES } from '@/constants/routes';
import type { Order } from '@/types/api';

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const preview = order.items?.slice(0, 2) ?? [];
  const itemCount = order.itemCount ?? order.items?.length ?? 0;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-500">{vi.order.orderCode}:</span>
              <span className="font-semibold text-slate-900">{order.orderNumber}</span>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-sm text-slate-600">
              {vi.order.orderDate}: {formatDate(order.createdAt)}
            </p>
            <p className="text-sm text-slate-600">
              {itemCount} {vi.order.productCount}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-slate-500">{vi.order.totalAmount}</p>
            <p className="text-lg font-semibold text-blue-600">
              {formatVND(order.total)}
            </p>
          </div>
        </div>

        {preview.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
            <ul className="space-y-2">
              {preview.map((item) => (
                <li key={item.id} className="flex items-center gap-3 text-sm">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveProductImage(item.productImage)}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="min-w-0 flex-1 truncate text-slate-700">
                    {item.productName} × {item.quantity}
                  </span>
                  <span className="shrink-0 font-medium text-slate-900">
                    {formatVND(item.totalPrice)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t border-slate-100 p-4 sm:px-5">
          <Link href={ROUTES.account.order(order.id)}>
            <Button variant="outline" className="w-full gap-2 sm:w-auto">
              {vi.order.viewDetail}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
