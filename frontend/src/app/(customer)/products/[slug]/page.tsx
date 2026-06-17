'use client';

import { useCallback, useState } from 'react';
import { useParams } from 'next/navigation';
import { useGetProductBySlugQuery } from '@/store/api/productApi';
import { AddToCartButton } from '@/features/cart/components/AddToCartButton';
import { VariantSelector } from '@/features/product/components/VariantSelector';
import { ProductReviews } from '@/features/product/components/ProductReviews';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { stockBadge } from '@/lib/design';
import { formatPriceRange, formatVND, vi } from '@/lib/i18n';
import { resolveProductDisplayImages, stockStatusMessage } from '@/lib/variants';
import type { ProductVariant } from '@/types/api';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useGetProductBySlugQuery(slug);
  const product = data?.data;
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [partialSelection, setPartialSelection] = useState<Record<string, string>>({});

  const onVariantChange = useCallback((v: ProductVariant | null) => {
    setSelectedVariant(v);
  }, []);

  const onSelectionChange = useCallback((selection: Record<string, string>) => {
    setPartialSelection(selection);
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-2 md:px-6">
        <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <p className="py-24 text-center text-slate-600">{vi.product.notFound}</p>
    );
  }

  const displayImages = resolveProductDisplayImages(
    product,
    selectedVariant,
    partialSelection,
  );
  const priceMin = product.priceMin ?? product.price;
  const priceMax = product.priceMax ?? product.price;
  const displayPrice = selectedVariant
    ? selectedVariant.price
    : priceMin;
  const hasOptions = (product.options?.length ?? 0) > 0;
  const addDisabled =
    !product.isActive ||
    !selectedVariant ||
    selectedVariant.stock < 1 ||
    !selectedVariant.isActive;
  const addHint =
    hasOptions && !selectedVariant
      ? `${vi.product.selectColor} · ${vi.product.selectSize}`
      : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
    <div className="grid gap-10 md:grid-cols-2 md:gap-16">
      <div className="overflow-hidden rounded-2xl bg-slate-50 shadow-md">
        <div className="aspect-[3/4]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayImages[0]}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>
      </div>
      <div>
        {selectedVariant && (
          <Badge variant={stockBadge(selectedVariant.stock).variant} className="mb-4">
            {selectedVariant.stock < 1
              ? vi.product.outOfStock
              : stockStatusMessage(selectedVariant.stock)}
          </Badge>
        )}
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
          {product.name}
        </h1>
        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-2xl font-semibold text-slate-900">
            {selectedVariant
              ? formatVND(displayPrice)
              : formatPriceRange(priceMin, priceMax)}
          </span>
          {(selectedVariant?.comparePrice ?? product.comparePrice) != null &&
            (selectedVariant?.comparePrice ?? product.comparePrice)! > displayPrice && (
              <span className="text-lg text-slate-400 line-through">
                {formatVND(
                  (selectedVariant?.comparePrice ?? product.comparePrice)!,
                )}
              </span>
            )}
        </div>
        <p className="mt-6 leading-relaxed text-slate-600">{product.description}</p>

        <div className="mt-8">
          <VariantSelector
            product={product}
            onVariantChange={onVariantChange}
            onSelectionChange={onSelectionChange}
          />
        </div>

        <Card className="mt-8">
          <CardContent className="p-5">
            <AddToCartButton
              productId={product.id}
              variantId={selectedVariant?.id}
              disabled={addDisabled}
              hint={addHint}
            />
          </CardContent>
        </Card>
      </div>
    </div>
    <ProductReviews productId={product.id} />
    </div>
  );
}
