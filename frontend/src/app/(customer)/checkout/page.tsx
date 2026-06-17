import { CheckoutForm } from '@/features/order/components/CheckoutForm';
import { vi } from '@/lib/i18n';

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          {vi.checkout.title}
        </h1>
        <p className="mt-2 text-slate-600">{vi.checkout.subtitle}</p>
      </div>
      <CheckoutForm />
    </div>
  );
}
