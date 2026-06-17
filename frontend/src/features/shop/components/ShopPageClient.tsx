'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { ProductCard } from '@/components/common/ProductCard';
import { ProductGridSkeleton } from '@/components/common/ProductGridSkeleton';
import { productGridWithSidebarClass } from '@/lib/product-grid';
import { EmptyState } from '@/components/common/EmptyState';
import { ApiErrorAlert } from '@/components/common/ApiErrorAlert';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
} from '@/components/ui/sheet';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  buildShopSearchParams,
  countActiveFilters,
  parseShopSearchParams,
  shopFiltersToApiParams,
} from '@/lib/shop/shop-params';
import { vi } from '@/lib/i18n';
import { ROUTES } from '@/constants/routes';
import {
  useGetProductsQuery,
  useGetFilterOptionsQuery,
  mapProductListMeta,
} from '@/store/api/productApi';
import { useGetCategoriesQuery } from '@/store/api/categoryApi';
import { useGetBrandsQuery } from '@/store/api/brandApi';
import {
  DEFAULT_SHOP_FILTERS,
  SHOP_PAGE_SIZE,
  type ShopFiltersState,
  type ShopSort,
} from '@/types/shop';
import { ShopSearchBar } from './ShopSearchBar';
import { ShopFiltersPanel } from './ShopFiltersPanel';
import { ShopActiveFilters } from './ShopActiveFilters';
import { ShopSortSelect } from './ShopSortSelect';
import { ShopPagination } from './ShopPagination';

export function ShopPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlFilters = useMemo(
    () => parseShopSearchParams(searchParams),
    [searchParams],
  );

  const [searchInput, setSearchInput] = useState(urlFilters.q);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<ShopFiltersState>(urlFilters);

  const debouncedSearch = useDebouncedValue(searchInput, 400);

  useEffect(() => {
    setSearchInput(urlFilters.q);
    setDraftFilters(urlFilters);
  }, [urlFilters]);

  const pushFilters = useCallback(
    (next: ShopFiltersState, options?: { replace?: boolean }) => {
      const params = buildShopSearchParams(next);
      const qs = params.toString();
      const href = qs ? `${ROUTES.shop}?${qs}` : ROUTES.shop;
      if (options?.replace) {
        router.replace(href, { scroll: false });
      } else {
        router.push(href, { scroll: false });
      }
    },
    [router],
  );

  useEffect(() => {
    if (debouncedSearch === urlFilters.q) return;
    pushFilters({ ...urlFilters, q: debouncedSearch, page: 1 }, { replace: true });
  }, [debouncedSearch, urlFilters, pushFilters]);

  const apiParams = useMemo(() => shopFiltersToApiParams(urlFilters), [urlFilters]);

  const min = urlFilters.minPrice ? Number(urlFilters.minPrice) : undefined;
  const max = urlFilters.maxPrice ? Number(urlFilters.maxPrice) : undefined;
  const priceInvalid =
    min != null &&
    max != null &&
    !Number.isNaN(min) &&
    !Number.isNaN(max) &&
    min > max;

  const { data, isLoading, isFetching, isError } = useGetProductsQuery(
    priceInvalid ? undefined : apiParams,
    { skip: priceInvalid },
  );

  const { data: categoriesData, isLoading: categoriesLoading } = useGetCategoriesQuery({
    page: 1,
    limit: 100,
  });
  const { data: brandsData, isLoading: brandsLoading } = useGetBrandsQuery({
    page: 1,
    limit: 100,
  });
  const { data: filterOptionsData } = useGetFilterOptionsQuery();

  const categories = categoriesData?.data ?? [];
  const brands = brandsData?.data ?? [];
  const filterColors = filterOptionsData?.data?.colors ?? [];
  const filterSizes = filterOptionsData?.data?.sizes ?? [];
  const products = data?.data ?? [];
  const pagination = mapProductListMeta(data?.meta);
  const activeFilterCount = countActiveFilters(urlFilters);
  const showSkeleton = isLoading || (isFetching && !products.length);

  const updateUrlFilters = (patch: Partial<ShopFiltersState>) => {
    const next = { ...urlFilters, ...patch };
    pushFilters(next);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    pushFilters(DEFAULT_SHOP_FILTERS);
    setMobileFiltersOpen(false);
  };

  const applyMobileFilters = () => {
    pushFilters({ ...draftFilters, q: debouncedSearch || draftFilters.q });
    setMobileFiltersOpen(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
      <div className="mb-16 text-center">
        <span className="text-primary text-[10px] font-bold uppercase tracking-[0.4em] mb-4 block">
          Collection
        </span>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-secondary tracking-widest uppercase">
          {vi.shop.title}
        </h1>
        <div className="mt-4 h-0.5 w-12 bg-primary mx-auto mb-4"></div>
        <p className="text-text-secondary font-serif italic text-lg">{vi.shop.subtitle}</p>
      </div>

      <div className="sticky top-16 z-30 -mx-4 mb-10 border-b border-border bg-white/95 px-4 py-6 backdrop-blur-md sm:static sm:mx-0 sm:rounded-sm sm:border sm:px-6 sm:shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <ShopSearchBar value={searchInput} onChange={setSearchInput} />
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <Button
              variant="outline"
              className="gap-2 lg:hidden rounded-sm border-secondary text-secondary uppercase tracking-widest text-[10px] font-bold"
              onClick={() => {
                setDraftFilters(urlFilters);
                setMobileFiltersOpen(true);
              }}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {vi.shop.filters.toUpperCase()}
              {activeFilterCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <ShopSortSelect
              value={urlFilters.sort}
              onChange={(sort: ShopSort) => updateUrlFilters({ sort, page: 1 })}
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <ShopActiveFilters
          filters={urlFilters}
          categories={categories}
          brands={brands}
          onRemove={updateUrlFilters}
          onClearAll={clearAllFilters}
        />
      </div>

      <div className="flex gap-12">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-sm border border-border bg-white p-6 shadow-sm">
            <div className="mb-8 flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">{vi.shop.filters}</h2>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-[10px] uppercase tracking-widest font-bold text-primary p-0 h-auto">
                  {vi.shop.clearAll}
                </Button>
              )}
            </div>
            <ShopFiltersPanel
              filters={urlFilters}
              categories={categories}
              brands={brands}
              colors={filterColors}
              sizes={filterSizes}
              categoriesLoading={categoriesLoading}
              brandsLoading={brandsLoading}
              onChange={updateUrlFilters}
              onClear={clearAllFilters}
            />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {!priceInvalid && !isLoading && (
            <p className="mb-6 text-[10px] uppercase tracking-widest text-text-muted">
              <span className="font-bold text-secondary">
                {pagination.totalItems}
              </span>{' '}
              {vi.shop.results}
            </p>
          )}

          {isError && (
            <div className="mb-6">
              <ApiErrorAlert />
            </div>
          )}

          {priceInvalid ? (
            <EmptyState
              title={vi.shop.priceInvalid}
              description={vi.shop.noProductsDesc}
              action={
                <Button variant="outline" onClick={() => updateUrlFilters({ minPrice: '', maxPrice: '' })}>
                  {vi.shop.clearFilters}
                </Button>
              }
            />
          ) : showSkeleton ? (
            <ProductGridSkeleton count={SHOP_PAGE_SIZE} layout="sidebar" />
          ) : products.length === 0 ? (
            <EmptyState
              title={vi.shop.noProducts}
              description={vi.shop.noProductsDesc}
              action={
                <div className="flex flex-wrap justify-center gap-3">
                  {activeFilterCount > 0 && (
                    <Button variant="outline" onClick={clearAllFilters}>
                      {vi.shop.clearFilters}
                    </Button>
                  )}
                  <Link href={ROUTES.shop}>
                    <Button>{vi.shop.backToShop}</Button>
                  </Link>
                </div>
              }
            />
          ) : (
            <>
              <div
                className={`${productGridWithSidebarClass} ${
                  isFetching ? 'opacity-70 transition-opacity' : ''
                }`}
              >
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} showStock showSale />
                ))}
              </div>
              <div className="mt-10">
                <ShopPagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={(page) => {
                    updateUrlFilters({ page });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  isLoading={isFetching}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="left" className="max-w-[min(100%,20rem)]">
          <SheetHeader>
            <SheetTitle>{vi.shop.filters}</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <ShopFiltersPanel
              filters={draftFilters}
              categories={categories}
              brands={brands}
              colors={filterColors}
              sizes={filterSizes}
              categoriesLoading={categoriesLoading}
              brandsLoading={brandsLoading}
              onChange={(patch) => setDraftFilters((f) => ({ ...f, ...patch }))}
              onClear={() => setDraftFilters(DEFAULT_SHOP_FILTERS)}
              showActions
              onApply={applyMobileFilters}
            />
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  );
}
