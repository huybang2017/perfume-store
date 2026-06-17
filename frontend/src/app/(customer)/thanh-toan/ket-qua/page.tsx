'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime, formatVND, vi } from '@/lib/i18n';
import { ROUTES } from '@/constants/routes';
import { useGetOrderQuery } from '@/store/api/orderApi';
import { useDemoConfirmPaymentMutation } from '@/store/api/paymentApi';

function PaymentResultContent() {
  const search = useSearchParams();
  const router = useRouter();
  const status = search.get('status') ?? 'pending';
  const orderId = search.get('orderId') ?? '';
  const orderNumber = search.get('orderNumber') ?? '';
  const message = search.get('message') ?? '';
  const demo = search.get('demo') === '1';
  const method = search.get('method') ?? '';

  const { data: orderData } = useGetOrderQuery(orderId, { skip: !orderId });
  const [demoConfirm, { isLoading: confirming }] = useDemoConfirmPaymentMutation();

  const order = orderData?.data;
  const amount = order?.total ?? 0;

  const handleDemoConfirm = async () => {
    if (!orderId) return;
    try {
      await demoConfirm(orderId).unwrap();
      router.replace(
        `${ROUTES.payment.result}?status=success&orderId=${orderId}&orderNumber=${order?.orderNumber ?? orderNumber}`,
      );
    } catch {
      /* API error */
    }
  };

  if (status === 'success') {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="mt-4 text-2xl">{vi.payment.result.successTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          <p>
            {vi.payment.result.orderCode}:{' '}
            <span className="font-semibold text-slate-900">
              {order?.orderNumber ?? orderNumber}
            </span>
          </p>
          {amount > 0 && (
            <p>
              {vi.payment.result.amount}:{' '}
              <span className="font-semibold text-slate-900">{formatVND(amount)}</span>
            </p>
          )}
          {order?.updatedAt && (
            <p>
              {vi.payment.result.paidAt}: {formatDateTime(order.updatedAt)}
            </p>
          )}
          {orderId && (
            <Button asChild className="w-full">
              <Link href={ROUTES.account.order(orderId)}>{vi.payment.result.viewOrder}</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (status === 'failed') {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="mt-4 text-2xl">{vi.payment.result.failedTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          {message && <p className="text-red-600">{message}</p>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" className="flex-1">
              <Link href={ROUTES.checkout}>{vi.payment.result.retry}</Link>
            </Button>
            {orderId && (
              <Button asChild className="flex-1">
                <Link href={ROUTES.account.order(orderId)}>{vi.payment.result.viewOrder}</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg text-center">
      <CardHeader>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <Clock className="h-10 w-10 text-amber-600" />
        </div>
        <CardTitle className="mt-4 text-2xl">{vi.payment.result.pendingTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-slate-600">
        <p>{vi.payment.result.pendingDesc}</p>
        {method && (
          <p className="font-medium text-slate-800">
            {vi.order.paymentMethod}: {method}
          </p>
        )}
        {demo && orderId && (
          <Button
            className="w-full"
            onClick={handleDemoConfirm}
            disabled={confirming}
          >
            {confirming ? vi.common.loading : vi.payment.result.demoConfirm}
          </Button>
        )}
        {orderId && (
          <Button asChild variant="outline" className="w-full">
            <Link href={ROUTES.account.order(orderId)}>{vi.payment.result.viewOrder}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function PaymentResultPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <Suspense fallback={<p className="text-center text-slate-600">{vi.common.loading}</p>}>
        <PaymentResultContent />
      </Suspense>
    </div>
  );
}
