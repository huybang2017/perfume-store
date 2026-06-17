'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, ShoppingCart } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { OrderStatusBadge } from '@/components/common/StatusBadge';
import { OrderTimeline } from '@/components/common/OrderTimeline';
import {
  AdminDataTable,
  AdminPagination,
  AdminStatsRow,
  AdminFilterField,
  AdminToolbar,
  ConfirmDialog,
} from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useGetOrdersQuery,
  useGetOrderQuery,
  useGetOrderStatsQuery,
  useBulkOrdersMutation,
  useUpdateOrderStatusMutation,
  useCancelOrderMutation,
} from '@/store/api/orderApi';
import type { Order, OrderStatus } from '@/types/api';
import { formatDate, formatVND, vi } from '@/lib/i18n';
import { ApiErrorAlert } from '@/components/common/ApiErrorAlert';
import { orderStatusConfig } from '@/lib/design';
import { useRouter, useSearchParams } from 'next/navigation';

const STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

const SORT_OPTIONS = [
  { value: 'newest', label: vi.admin.sortNewest },
  { value: 'oldest', label: vi.admin.sortOldest },
  { value: 'total_desc', label: vi.admin.sortTotalDesc },
  { value: 'total_asc', label: vi.admin.sortTotalAsc },
];

export function AdminOrdersTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Number(searchParams.get('limit')) || 10;
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const paymentStatus = searchParams.get('paymentStatus') ?? '';
  const paymentMethod = searchParams.get('paymentMethod') ?? '';
  const dateFrom = searchParams.get('dateFrom') ?? '';
  const dateTo = searchParams.get('dateTo') ?? '';
  const sort = searchParams.get('sort') ?? 'newest';

  const [searchInput, setSearchInput] = useState(search);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const push = useCallback(
    (patch: Record<string, string>) => {
      const p = new URLSearchParams(searchParams.toString());
      Object.entries(patch).forEach(([k, v]) => {
        if (v) p.set(k, v);
        else p.delete(k);
      });
      if (!patch.page) p.delete('page');
      router.push(`?${p.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => setSearchInput(search), [search]);

  const { data: statsData, isLoading: statsLoading } = useGetOrderStatsQuery();
  const { data, isLoading, isFetching, isError } = useGetOrdersQuery({
    page,
    limit,
    search: search || undefined,
    status: (status as OrderStatus) || undefined,
    paymentStatus: paymentStatus || undefined,
    paymentMethod: paymentMethod || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sort: sort as 'newest' | 'oldest' | 'total_asc' | 'total_desc',
  });
  const [bulkOrders] = useBulkOrdersMutation();
  const { data: detailData, isLoading: detailLoading, isError: detailError } = useGetOrderQuery(selectedId!, {
    skip: !selectedId,
  });
  const [updateStatus] = useUpdateOrderStatusMutation();
  const [cancelOrder] = useCancelOrderMutation();

  const orders = Array.isArray(data?.data) ? data.data : [];
  const order = detailData?.data;
  const meta = data?.meta;
  const filterCount = [status, paymentStatus, paymentMethod, dateFrom, dateTo].filter(Boolean).length;

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(orders.map((o) => o.id)) : new Set());
  };
  const toggleRow = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleExport = () => {
    const rows = orders.map((o) =>
      [o.orderNumber, o.status, o.total, o.createdAt].join(','),
    );
    const csv = ['Ma don,Trang thai,Tong tien,Ngay\n', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `don-hang-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sortOptions = useMemo(() => SORT_OPTIONS, []);

  return (
    <div className="space-y-6">
      <PageHeader title={vi.admin.orders} description={vi.admin.ordersDesc} />

      <AdminStatsRow
        isLoading={statsLoading}
        columns={5}
        stats={[
          { label: vi.admin.totalOrders, value: statsData?.data?.total, icon: ShoppingCart },
          { label: vi.admin.pendingOrders, value: statsData?.data?.pending, icon: ShoppingCart, accent: 'warning' },
          { label: vi.admin.shippingOrders, value: statsData?.data?.shipped, icon: ShoppingCart },
          { label: vi.admin.completedOrders, value: statsData?.data?.delivered, icon: ShoppingCart, accent: 'success' },
          { label: vi.admin.cancelledOrders, value: statsData?.data?.cancelled, icon: ShoppingCart },
        ]}
      />

      <AdminToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={() => push({ search: searchInput, page: '1' })}
        searchPlaceholder="Order code, customer name, phone..."
        sortValue={sort}
        sortOptions={sortOptions}
        onSortChange={(v) => push({ sort: v, page: '1' })}
        filterCount={filterCount}
        onClearFilters={() =>
          push({
            status: '',
            paymentStatus: '',
            paymentMethod: '',
            dateFrom: '',
            dateTo: '',
            page: '1',
          })
        }
        actions={
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            {vi.admin.export}
          </Button>
        }
        filters={
          <>
            <AdminFilterField label={vi.admin.filterStatus}>
              <Select
                className="h-10"
                value={status}
                onChange={(e) => push({ status: e.target.value, page: '1' })}
              >
                <option value="">{vi.admin.allStatuses}</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {orderStatusConfig[s].label}
                  </option>
                ))}
              </Select>
            </AdminFilterField>
            <AdminFilterField label={vi.admin.paymentStatus}>
              <Select
                className="h-10"
                value={paymentStatus}
                onChange={(e) => push({ paymentStatus: e.target.value, page: '1' })}
              >
                <option value="">{vi.admin.all}</option>
                <option value="unpaid">Unpaid</option>
                <option value="processing">Processing</option>
                <option value="paid">Paid</option>
                <option value="refunded">Refunded</option>
              </Select>
            </AdminFilterField>
            <AdminFilterField label={vi.admin.paymentMethod}>
              <Select
                className="h-10"
                value={paymentMethod}
                onChange={(e) => push({ paymentMethod: e.target.value, page: '1' })}
              >
                <option value="">{vi.admin.all}</option>
                <option value="COD">COD</option>
                <option value="BANK_TRANSFER">Bank transfer</option>
                <option value="VNPAY">VNPay</option>
                <option value="MOMO">MoMo</option>
              </Select>
            </AdminFilterField>
            <AdminFilterField label={vi.admin.dateFrom}>
              <Input
                className="h-10"
                type="date"
                value={dateFrom}
                onChange={(e) => push({ dateFrom: e.target.value, page: '1' })}
              />
            </AdminFilterField>
            <AdminFilterField label={vi.admin.dateTo}>
              <Input
                className="h-10"
                type="date"
                value={dateTo}
                onChange={(e) => push({ dateTo: e.target.value, page: '1' })}
              />
            </AdminFilterField>
          </>
        }
      />

      <div className={isFetching ? 'opacity-70 transition-opacity' : ''}>
        <AdminDataTable<Order>
          data={orders}
          isLoading={isLoading}
          isError={isError}
          emptyMessage={vi.admin.noOrders}
          selectedIds={selected}
          onSelectAll={toggleAll}
          onSelectRow={toggleRow}
          onRowClick={(row) => setSelectedId(row.id)}
          bulkBar={
            <>
              <Button
                size="sm"
                onClick={() => {
                  bulkOrders({ ids: [...selected], action: 'confirm' });
                  setSelected(new Set());
                }}
              >
                {vi.admin.bulkConfirm}
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  bulkOrders({ ids: [...selected], action: 'cancel' });
                  setSelected(new Set());
                }}
              >
                {vi.admin.bulkCancel}
              </Button>
            </>
          }
          columns={[
            { key: 'orderNumber', header: vi.order.orderCode },
            {
              key: 'customer',
              header: vi.admin.customerInfo,
              render: (r) => (
                <div>
                  <p className="font-medium">{r.shippingAddress?.fullName ?? '—'}</p>
                  <p className="text-xs text-slate-500">{r.shippingAddress?.phone ?? ''}</p>
                </div>
              ),
            },
            {
              key: 'status',
              header: vi.common.status,
              render: (r) => <OrderStatusBadge status={r.status} />,
            },
            {
              key: 'paymentStatus',
              header: vi.admin.paymentStatus,
              render: (r) => (
                <span className="text-sm capitalize">{r.paymentStatus ?? '—'}</span>
              ),
            },
            {
              key: 'total',
              header: vi.checkout.total,
              render: (r) => <span className="font-medium">{formatVND(r.total)}</span>,
            },
            {
              key: 'createdAt',
              header: vi.common.date,
              render: (r) => formatDate(r.createdAt),
            },
            {
              key: 'id',
              header: vi.common.actions,
              render: (r) => (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" size="sm" onClick={() => setSelectedId(r.id)}>
                    {vi.admin.viewDetail}
                  </Button>
                  {r.status !== 'cancelled' && (
                    <Button variant="ghost" size="sm" onClick={() => setCancelId(r.id)}>
                      {vi.common.cancel}
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>

      <AdminPagination
        page={page}
        totalPages={meta?.totalPages ?? 1}
        totalItems={meta?.total ?? 0}
        pageSize={limit}
        onPageChange={(p) => push({ page: String(p) })}
        onPageSizeChange={(size) => push({ limit: String(size), page: '1' })}
        isLoading={isFetching}
      />

      <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {order ? `${vi.order.title} ${order.orderNumber}` : vi.admin.orderDetail}
            </SheetTitle>
          </SheetHeader>
          <SheetBody>
            {detailLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : detailError ? (
              <ApiErrorAlert />
            ) : order ? (
              <div className="space-y-6">
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-600">{vi.admin.customerInfo}</p>
                  <div className="rounded-xl bg-slate-50 p-4 text-sm">
                    <p>{order.shippingAddress?.fullName}</p>
                    <p>{order.shippingAddress?.phone}</p>
                    <p className="text-slate-600">
                      {[
                        order.shippingAddress?.street,
                        order.shippingAddress?.ward,
                        order.shippingAddress?.district,
                        order.shippingAddress?.province,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-slate-600">{vi.common.status}</p>
                  <Select
                    value={order.status}
                    disabled={order.status === 'cancelled'}
                    onChange={(e) =>
                      updateStatus({ id: order.id, status: e.target.value as OrderStatus })
                    }
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {orderStatusConfig[s].label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <p className="mb-3 text-sm font-medium text-slate-600">{vi.admin.orderTimeline}</p>
                  <OrderTimeline status={order.status} />
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-slate-600">{vi.order.items}</p>
                  <ul className="space-y-2">
                    {(Array.isArray(order.items) ? order.items : []).map((item) => (
                      <li
                        key={item.id}
                        className="rounded-xl bg-slate-50 px-4 py-3 text-sm"
                      >
                        <div className="flex justify-between">
                          <span>
                            {item.productName} × {item.quantity}
                          </span>
                          <span className="font-medium">{formatVND(item.totalPrice)}</span>
                        </div>
                        {item.sku && (
                          <p className="mt-1 text-xs text-slate-500">
                            {vi.order.sku}: {item.sku}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 text-sm">
                  <p className="mb-1 text-slate-600">
                    {vi.order.paymentMethod}: {order.paymentMethod ?? '—'}
                  </p>
                  <p className="mb-2 text-slate-600">
                    {vi.admin.paymentStatus}: {order.paymentStatus ?? '—'}
                  </p>
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold">
                    <span>{vi.checkout.total}</span>
                    <span>{formatVND(order.total)}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </SheetBody>
          {order && order.status !== 'cancelled' && (
            <SheetFooter>
              <Button variant="danger" className="w-full" onClick={() => setCancelId(order.id)}>
                {vi.admin.cancelOrder}
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!cancelId}
        onOpenChange={(o) => !o && setCancelId(null)}
        title={vi.admin.cancelOrder}
        description={vi.order.cancelConfirm}
        confirmLabel={vi.order.confirmCancel}
        onConfirm={async () => {
          if (cancelId) await cancelOrder(cancelId);
          setCancelId(null);
          setSelectedId(null);
        }}
      />
    </div>
  );
}
