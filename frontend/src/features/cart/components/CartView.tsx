'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useGetCartQuery,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
} from '@/store/api/cartApi';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import { formatVND, vi } from '@/lib/i18n';
import { resolveProductImage } from '@/lib/product-images';
import { VariantLineDetails } from '@/features/product/components/VariantLineDetails';

export function CartView() {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useAuth();
  const { data, isLoading, isError } = useGetCartQuery(undefined, {
    skip: !mounted || !isAuthenticated,
  });
  const [updateItem] = useUpdateCartItemMutation();
  const [removeItem] = useRemoveCartItemMutation();
  const [clearCart] = useClearCartMutation();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <EmptyState
        title={vi.cart.signInToView}
        description={vi.cart.signInDesc}
        icon={<ShoppingBag className="h-6 w-6" />}
        action={
          <Link href={ROUTES.auth.login}>
            <Button>{vi.common.signIn}</Button>
          </Link>
        }
      />
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="rounded-xl bg-red-50 py-12 text-center text-sm text-red-600">
        {vi.cart.loadFailed}
      </p>
    );
  }

  const cart = data?.data;
  const items = (cart?.items ?? []).filter(
    (item) =>
      item?.product?.name &&
      Number.isFinite(item.unitPrice) &&
      Number.isFinite(item.lineTotal),
  );

  if (!items.length) {
    return (
      <EmptyState
        title={vi.cart.empty}
        description={vi.cart.emptyDesc}
        icon={<ShoppingBag className="h-6 w-6" />}
        action={
          <Link href={ROUTES.shop}>
            <Button>{vi.common.continueShopping}</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className="flex gap-4 p-5">
              <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveProductImage(
                    typeof item.product.image === 'string' ? item.product.image : null,
                  )}
                  alt={item.product.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link
                    href={ROUTES.product(item.product.slug)}
                    className="font-medium text-slate-900 transition-colors hover:text-blue-600"
                  >
                    {item.product.name}
                  </Link>
                  <VariantLineDetails
                    variantOptions={item.variantOptions}
                    sku={item.sku}
                    className="mt-1 text-xs"
                  />
                  <p className="text-sm text-slate-600">
                    {formatVND(item.unitPrice)} / {vi.cart.each}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        updateItem({
                          itemId: item.id,
                          quantity: Math.max(1, item.quantity - 1),
                        })
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={item.quantity >= item.product.stock}
                      onClick={() =>
                        updateItem({ itemId: item.id, quantity: item.quantity + 1 })
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-900">
                      {formatVND(item.lineTotal)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      aria-label={vi.cart.removeItem}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <Button variant="outline" onClick={() => clearCart()}>
          {vi.cart.clearCart}
        </Button>
      </div>

      <Card className="h-fit lg:sticky lg:top-24">
        <CardHeader>
          <CardTitle>{vi.cart.summary}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">
              {vi.cart.subtotal} ({cart?.itemCount} {vi.cart.items})
            </span>
            <span className="font-medium">{formatVND(cart?.subtotal ?? 0)}</span>
          </div>
          <Link href={ROUTES.checkout}>
            <Button className="w-full" size="lg">
              {vi.cart.checkout}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
