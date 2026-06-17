'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAddCartItemMutation } from '@/store/api/cartApi';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import { vi } from '@/lib/i18n';

interface AddToCartButtonProps {
  productId: string;
  variantId?: string;
  disabled?: boolean;
  hint?: string;
}

export function AddToCartButton({
  productId,
  variantId,
  disabled,
  hint,
}: AddToCartButtonProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [addItem, { isLoading }] = useAddCartItemMutation();
  const [added, setAdded] = useState(false);

  const handleAdd = async () => {
    if (!isAuthenticated) {
      router.push(ROUTES.auth.login);
      return;
    }
    if (!variantId) return;
    try {
      await addItem({ productId, variantId, quantity: 1 }).unwrap();
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      /* error */
    }
  };

  return (
    <div className="space-y-2">
      {hint && !variantId && (
        <p className="text-center text-sm text-amber-700">{hint}</p>
      )}
      <Button
        onClick={handleAdd}
        disabled={disabled || isLoading || !variantId}
        className="w-full"
        size="lg"
      >
        {isLoading
          ? vi.common.loading
          : added
            ? vi.cart.added
            : vi.cart.addToCart}
      </Button>
    </div>
  );
}
