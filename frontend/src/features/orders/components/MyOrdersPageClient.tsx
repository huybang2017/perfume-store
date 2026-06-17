'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { CustomerAuthGuard } from '@/components/guards/CustomerAuthGuard';
import { EmptyState } from '@/components/common/EmptyState';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useGetMyOrdersQuery, useGetMyOrderStatsQuery } from '@/store/api/orderApi';
import { vi } from '@/lib/i18n';
import { ROUTES } from '@/constants/routes';
import type { OrderStatus } from '@/types/api';
import { AccountSidebar } from './AccountSidebar';
import { OrderStatsCards } from './OrderStatsCards';
import { OrderCard } from './OrderCard';
import { OrderListSkeleton } from './OrderListSkeleton';
import { ShopPagination } from '@/features/shop/components/ShopPagination';

const PAGE_SIZE = 10;

const STATUS_TABS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: vi.order.tabAll },
  { key: 'pending', label: vi.order.statuses.pending },
  { key: 'confirmed', label: vi.order.statuses.confirmed },
  { key: 'processing', label: vi.order.statuses.processing },
  { key: 'shipped', label: vi.order.statuses.shipped },
  { key: 'delivered', label: vi.order.statuses.delivered },
  { key: 'cancelled', label: vi.order.statuses.cancelled },
];

export function MyOrdersPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = (searchParams.get('status') as OrderStatus | 'all') || 'all';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '');
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  const pushParams = useCallback(
    (patch: { status?: string; page?: number; q?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (patch.status !== undefined) {
        if (patch.status === 'all') params.delete('status');
        else params.set('status', patch.status);
        params.delete('page');
      }
      if (patch.page !== undefined) {
        if (patch.page <= 1) params.delete('page');
        else params.set('page', String(patch.page));
      }
      if (patch.q !== undefined) {
        if (!patch.q) params.delete('q');
        else params.set('q', patch.q);
        params.delete('page');
      }
      const qs = params.toString();
      router.push(qs ? `${ROUTES.account.orders}?${qs}` : ROUTES.account.orders, {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  useEffect(() => {
    const urlQ = searchParams.get('q') ?? '';
    if (debouncedSearch !== urlQ) {
      pushParams({ q: debouncedSearch });
    }
  }, [debouncedSearch, searchParams, pushParams]);

  const queryParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      status: statusParam === 'all' ? undefined : statusParam,
      search: debouncedSearch || undefined,
    }),
    [page, statusParam, debouncedSearch],
  );

  const { data: statsData, isLoading: statsLoading } = useGetMyOrderStatsQuery();
  const { data, isLoading, isFetching, isError } = useGetMyOrdersQuery(queryParams);

  const orders = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <CustomerAuthGuard redirectTo={ROUTES.account.orders}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">
            {vi.order.myOrders}
          </h1>
          <p className="mt-1 text-slate-600">{vi.order.myOrdersDesc}</p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          <AccountSidebar />

          <div className="min-w-0 flex-1 space-y-6">
            <OrderStatsCards stats={statsData?.data} isLoading={statsLoading} />

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={vi.order.searchPlaceholder}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => pushParams({ status: tab.key })}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    statusParam === tab.key
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-surface text-text-secondary hover:bg-border'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {isError ? (
              <p className="rounded-xl bg-red-50 py-8 text-center text-sm text-red-600">
                {vi.common.error}
              </p>
            ) : isLoading ? (
              <OrderListSkeleton count={3} />
            ) : orders.length === 0 ? (
              <EmptyState
                title={vi.order.emptyTitle}
                description={vi.order.emptyDesc}
                action={
                  <Link href={ROUTES.shop}>
                    <Button>{vi.order.continueShopping}</Button>
                  </Link>
                }
              />
            ) : (
              <>
                <div
                  className={`space-y-4 ${isFetching ? 'opacity-70 transition-opacity' : ''}`}
                >
                  {orders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
                <ShopPagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={(p) => {
                    pushParams({ page: p });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  isLoading={isFetching}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </CustomerAuthGuard>
  );
}
