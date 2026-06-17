'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatVND, vi } from '@/lib/i18n';
import { useGetPaymentByOrderQuery } from '@/store/api/paymentApi';

interface BankTransferInfoProps {
  orderId: string;
  orderNumber: string;
  total: number;
}

export function BankTransferInfo({
  orderId,
  orderNumber,
  total,
}: BankTransferInfoProps) {
  const { data } = useGetPaymentByOrderQuery(orderId);
  const [stored, setStored] = useState<{
    bankName: string;
    bankAccount: string;
    bankHolder: string;
    transferContent: string;
    amount?: string;
  } | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(`bankTransfer:${orderId}`);
    if (raw) {
      try {
        setStored(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
  }, [orderId]);

  const bank = data?.data?.bankTransfer ?? stored;
  if (!bank) return null;

  return (
    <Card className="border-amber-200 bg-amber-50/30">
      <CardHeader>
        <CardTitle className="text-base text-amber-900">
          {vi.payment.bankTransferTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-slate-500">{vi.payment.bankName}</p>
          <p className="font-medium text-slate-900">{bank.bankName}</p>
        </div>
        <div>
          <p className="text-slate-500">{vi.payment.bankAccount}</p>
          <p className="font-medium text-slate-900">{bank.bankAccount}</p>
        </div>
        <div>
          <p className="text-slate-500">{vi.payment.bankHolder}</p>
          <p className="font-medium text-slate-900">{bank.bankHolder}</p>
        </div>
        <div>
          <p className="text-slate-500">{vi.payment.transferContent}</p>
          <p className="font-mono font-semibold text-blue-700">
            {bank.transferContent || orderNumber}
          </p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-slate-500">{vi.checkout.total}</p>
          <p className="text-lg font-semibold text-slate-900">
            {formatVND(Number(bank.amount ?? total))}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
