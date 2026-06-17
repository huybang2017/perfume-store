'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/common/ProductCard';
import { ProductGridSkeleton } from '@/components/common/ProductGridSkeleton';
import { productGridClass } from '@/lib/product-grid';
import { useGetProductsQuery } from '@/store/api/productApi';
import { vi } from '@/lib/i18n';
import { ROUTES } from '@/constants/routes';

const TABS = [
  { slug: 'nu', label: vi.home.categoryNu },
  { slug: 'nam', label: vi.home.categoryNam },
  { slug: 'unisex', label: vi.home.categoryUnisex },
] as const;

type CategorySlug = (typeof TABS)[number]['slug'];

export function ShopByCategorySection() {
  const [activeSlug, setActiveSlug] = useState<CategorySlug>(TABS[0].slug);
  const activeLabel = TABS.find((tab) => tab.slug === activeSlug)?.label ?? '';

  const { data, isLoading } = useGetProductsQuery({
    category: activeSlug,
    isActive: true,
    status: 'active',
    limit: 6,
  });
  const products = data?.data ?? [];

  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center mb-16">
          <span className="text-primary text-[10px] font-bold uppercase tracking-[0.4em] mb-4 block">
            Discover
          </span>
          <h2 className="text-3xl font-serif font-bold text-secondary tracking-widest">
            SHOP BY CATEGORY
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {TABS.map((tab) => (
            <button
              key={tab.slug}
              type="button"
              onClick={() => setActiveSlug(tab.slug)}
              className={`px-7 py-2.5 text-xs font-bold uppercase tracking-widest rounded-sm border transition-colors ${
                activeSlug === tab.slug
                  ? 'bg-secondary text-white border-secondary'
                  : 'bg-white text-text-secondary border-border-subtle hover:border-secondary hover:text-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <ProductGridSkeleton count={6} />
        ) : products.length ? (
          <div className={productGridClass}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-text-secondary">
            {vi.home.noCategoryProducts}
          </p>
        )}

        <div className="mt-16 text-center">
          <Link href={`${ROUTES.shop}?category=${activeSlug}`}>
            <Button
              variant="outline"
              className="border-secondary text-secondary hover:bg-secondary hover:text-white rounded-sm px-12 uppercase tracking-widest text-[10px] font-bold"
            >
              {vi.home.viewAllCategory.toUpperCase()} — {activeLabel.toUpperCase()}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
