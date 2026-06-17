import { Suspense } from 'react';
import { ShopPageClient } from '@/features/shop/components/ShopPageClient';
import { ProductGridSkeleton } from '@/components/common/ProductGridSkeleton';
import { SHOP_PAGE_SIZE } from '@/types/shop';

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopPageFallback />}>
      <ShopPageClient />
    </Suspense>
  );
}

function ShopPageFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-8 h-10 w-48 animate-pulse rounded-lg bg-slate-100" />
      <div className="mb-6 h-11 animate-pulse rounded-lg bg-slate-100" />
      <ProductGridSkeleton count={SHOP_PAGE_SIZE} layout="sidebar" />
    </div>
  );
}
