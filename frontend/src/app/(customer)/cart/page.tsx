import { CartView } from '@/features/cart/components/CartView';
import { vi } from '@/lib/i18n';

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          {vi.cart.title}
        </h1>
        <p className="mt-2 text-slate-600">{vi.cart.subtitle}</p>
      </div>
      <CartView />
    </div>
  );
}
