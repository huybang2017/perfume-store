'use client';

import Link from 'next/link';
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { KpiCard } from '@/components/common/KpiCard';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetStatsQuery, useGetAnalyticsQuery } from '@/store/api/dashboardApi';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { formatVND, vi } from '@/lib/i18n';
import { ROUTES } from '@/constants/routes';
import { ApiErrorAlert } from '@/components/common/ApiErrorAlert';

const quickActions = [
  { href: ROUTES.admin.products, label: vi.admin.manageProducts, icon: Package },
  { href: ROUTES.admin.orders, label: vi.admin.viewOrders, icon: ShoppingCart },
  { href: ROUTES.admin.vouchers, label: vi.admin.createVoucher, icon: Plus },
  { href: ROUTES.admin.inventory, label: vi.admin.checkInventory, icon: TrendingUp },
];

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState('30d');
  const { data, isLoading, isError } = useGetStatsQuery();
  const { data: analyticsData, isLoading: analyticsLoading, isError: analyticsError } =
    useGetAnalyticsQuery(period);
  const stats = data?.data;
  const analytics = analyticsData?.data;

  return (
    <div className="space-y-8">
      <PageHeader title={vi.admin.dashboard} description={vi.brand.tagline} />

      {(isError || analyticsError) && <ApiErrorAlert />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={vi.admin.revenue}
          value={stats?.revenue != null ? formatVND(stats.revenue) : undefined}
          icon={DollarSign}
          isLoading={isLoading}
          accent="warning"
          trend={vi.admin.revenueTrend}
        />
        <KpiCard
          label={vi.admin.totalOrders}
          value={stats?.totalOrders}
          icon={ShoppingCart}
          isLoading={isLoading}
          accent="success"
        />
        <KpiCard
          label={vi.admin.totalCustomers}
          value={stats?.totalUsers}
          icon={Users}
          isLoading={isLoading}
          accent="primary"
        />
        <KpiCard
          label={vi.admin.totalProducts}
          value={stats?.totalProducts}
          icon={Package}
          isLoading={isLoading}
          accent="neutral"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Label>{vi.admin.filters}</Label>
        <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-40">
          <option value="today">{vi.admin.periodToday}</option>
          <option value="7d">{vi.admin.period7d}</option>
          <option value="30d">{vi.admin.period30d}</option>
          <option value="90d">{vi.admin.period90d}</option>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{vi.admin.revenueByDay}</CardTitle>
            <CardDescription>{vi.admin.ordersByDay}</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : analyticsError ? (
              <ApiErrorAlert />
            ) : (
              <div className="flex h-48 items-end justify-between gap-1 rounded-xl bg-slate-50 px-2 pb-4 pt-8">
                {(analytics?.daily ?? []).slice(-14).map((d, i) => {
                  const max = Math.max(
                    ...(analytics?.daily ?? []).map((x) => Number(x.revenue)),
                    1,
                  );
                  const h = (Number(d.revenue) / max) * 100;
                  return (
                    <div
                      key={i}
                      title={`${d.day}: ${formatVND(Number(d.revenue))}`}
                      className="flex-1 rounded-t bg-blue-500/80"
                      style={{ height: `${Math.max(h, 4)}%` }}
                    />
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{vi.admin.quickActions}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button
                  variant="outline"
                  className="h-auto w-full justify-between py-3 text-left font-normal"
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-blue-600" />
                    {label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {Array.isArray(analytics?.topProducts) && analytics.topProducts.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{vi.admin.bestSelling}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-slate-100">
              {analytics.topProducts.map((p) => (
                <li key={p.productId} className="flex justify-between py-3 text-sm">
                  <span className="font-medium text-slate-900">{p.productName}</span>
                  <span className="text-slate-600">{p.sold} sold</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
