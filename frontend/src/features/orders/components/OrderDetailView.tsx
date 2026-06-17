'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { OrderStatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useGetOrderQuery,
  useCancelOrderMutation,
  useReorderMutation,
} from '@/store/api/orderApi';
import { formatDateTime, formatVND, vi } from '@/lib/i18n';
import { resolveProductImage } from '@/lib/product-images';
import { VariantLineDetails } from '@/features/product/components/VariantLineDetails';
import { ROUTES } from '@/constants/routes';
import type { OrderStatus } from '@/types/api';
import { OrderTrackingTimeline } from './OrderTrackingTimeline';
import { BankTransferInfo } from '@/features/payment/components/BankTransferInfo';
import { CancelOrderDialog } from './CancelOrderDialog';
import { OrderDetailSkeleton } from './OrderDetailSkeleton';
import { AccountSidebar } from './AccountSidebar';

const CANCELLABLE: OrderStatus[] = ['pending', 'confirmed'];

function formatAddress(addr?: Record<string, string>) {
  if (!addr) return '—';
  if (addr.address) return addr.address;
  const parts = [
    addr.street,
    addr.ward,
    addr.district,
    addr.province ?? addr.city,
  ].filter(Boolean);
  return parts.join(', ') || '—';
}

interface OrderDetailViewProps {
  orderId: string;
}

export function OrderDetailView({ orderId }: OrderDetailViewProps) {
  const router = useRouter();
  const { data, isLoading, refetch } = useGetOrderQuery(orderId);
  const [cancelOrder, { isLoading: cancelling }] = useCancelOrderMutation();
  const [reorder, { isLoading: reordering }] = useReorderMutation();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const order = data?.data;

  const handleCancel = async (reason: string) => {
    try {
      await cancelOrder({ id: orderId, reason }).unwrap();
      setCancelOpen(false);
      setNotice('Order cancelled successfully');
      refetch();
    } catch {
      setNotice(vi.common.error);
    }
  };

  const handleReorder = async () => {
    try {
      const res = await reorder(orderId).unwrap();
      const added = res.data?.addedCount ?? 0;
      const skipped = res.data?.skipped?.length ?? 0;
      if (added > 0) {
        setNotice(
          skipped > 0 ? vi.order.reorderPartial : vi.order.reorderSuccess,
        );
        router.push(ROUTES.cart);
      } else {
        setNotice(vi.order.reorderFailed);
      }
    } catch {
      setNotice(vi.order.reorderFailed);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <OrderDetailSkeleton />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <p className="text-slate-600">{vi.order.notFound}</p>
        <Link href={ROUTES.account.orders} className="mt-4 inline-block">
          <Button variant="outline">{vi.order.backToOrders}</Button>
        </Link>
      </div>
    );
  }

  const canCancel = CANCELLABLE.includes(order.status);
  const canReorder = order.status === 'delivered';
  const addr = order.shippingAddress;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={ROUTES.account.orders}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {vi.order.backToOrders}
        </Link>
        <div className="flex flex-wrap gap-2">
          {canCancel && (
            <Button variant="danger" onClick={() => setCancelOpen(true)}>
              {vi.order.cancelOrder}
            </Button>
          )}
          {canReorder && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleReorder}
              disabled={reordering}
            >
              <RotateCcw className="h-4 w-4" />
              {reordering ? vi.common.loading : vi.order.reorder}
            </Button>
          )}
        </div>
      </div>

      {notice && (
        <p className="mb-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {notice}
        </p>
      )}

      <div className="flex flex-col gap-8 lg:flex-row">
        <AccountSidebar />

        <div className="min-w-0 flex-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-xl">
                  {vi.order.orderCode}: {order.orderNumber}
                </CardTitle>
                <p className="mt-1 text-sm text-slate-600">
                  {vi.order.orderDate}: {formatDateTime(order.createdAt)}
                </p>
              </div>
              <OrderStatusBadge status={order.status} />
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">{vi.order.paymentMethod}</p>
                <p className="text-sm font-medium text-slate-900">
                  {order.paymentMethod ?? 'Cash on delivery'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{vi.order.paymentStatus}</p>
                <p className="text-sm font-medium text-slate-900">
                  {order.paymentStatus ?? 'Unpaid'}
                </p>
              </div>
            </CardContent>
          </Card>

          {(order.paymentMethod === 'bank_transfer' ||
            order.paymentStatus === 'pending') && (
            <BankTransferInfo
              orderId={order.id}
              orderNumber={order.orderNumber}
              total={order.total}
            />
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{vi.order.tracking}</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderTrackingTimeline
                  status={order.status}
                  statusHistory={order.statusHistory}
                  paymentStatus={order.paymentStatus}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{vi.order.shippingInfo}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-500">{vi.order.recipientName}</p>
                  <p className="font-medium text-slate-900">
                    {addr?.fullName ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">{vi.order.recipientPhone}</p>
                  <p className="font-medium text-slate-900">
                    {addr?.phone ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">{vi.order.shippingAddress}</p>
                  <p className="font-medium text-slate-900">
                    {formatAddress(addr)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{vi.order.itemList}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-xl border border-slate-100 p-3 sm:p-4"
                >
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-24 sm:w-20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveProductImage(item.productImage)}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{item.productName}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {vi.order.quantity}: {item.quantity}
                    </p>
                    <VariantLineDetails
                      variantName={item.variantName ?? item.variant}
                      sku={item.sku}
                      className="mt-2"
                    />
                    <p className="mt-2 text-sm text-slate-600">
                      {vi.order.unitPrice}: {formatVND(item.unitPrice)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">{vi.order.lineTotal}</p>
                    <p className="font-semibold text-slate-900">
                      {formatVND(item.totalPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{vi.order.paymentSummary}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-slate-600">{vi.checkout.subtotal}</span>
                <span>{formatVND(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between py-1 text-green-600">
                  <span>
                    {vi.checkout.discount}
                    {order.voucherCode && ` (${order.voucherCode})`}
                  </span>
                  <span>-{formatVND(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-slate-600">{vi.checkout.shippingFee}</span>
                <span>{formatVND(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold">
                <span>{vi.checkout.total}</span>
                <span className="text-blue-600">{formatVND(order.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CancelOrderDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onConfirm={handleCancel}
        isLoading={cancelling}
      />
    </div>
  );
}
