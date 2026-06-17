'use client';

import { cn } from '@/lib/utils';
import type { PaymentMethod } from '@/store/api/paymentApi';
import { vi } from '@/lib/i18n';

const METHODS: {
  value: PaymentMethod;
  label: string;
  description: string;
}[] = [
  {
    value: 'COD',
    label: vi.payment.methods.cod,
    description: vi.payment.methods.codDesc,
  },
  {
    value: 'BANK_TRANSFER',
    label: vi.payment.methods.bank,
    description: vi.payment.methods.bankDesc,
  },
  {
    value: 'VNPAY',
    label: vi.payment.methods.vnpay,
    description: vi.payment.methods.vnpayDesc,
  },
  {
    value: 'MOMO',
    label: vi.payment.methods.momo,
    description: vi.payment.methods.momoDesc,
  },
];

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({
  value,
  onChange,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3" role="radiogroup" aria-label={vi.payment.selectMethod}>
      {METHODS.map((m) => (
        <label
          key={m.value}
          className={cn(
            'flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors',
            value === m.value
              ? 'border-blue-600 bg-blue-50/50'
              : 'border-slate-200 hover:border-slate-300',
          )}
        >
          <input
            type="radio"
            name="paymentMethod"
            value={m.value}
            checked={value === m.value}
            onChange={() => onChange(m.value)}
            className="mt-1 h-4 w-4 shrink-0 accent-blue-600"
          />
          <div>
            <p className="font-medium text-slate-900">{m.label}</p>
            <p className="mt-0.5 text-sm text-slate-600">{m.description}</p>
          </div>
        </label>
      ))}
    </div>
  );
}
