'use client';

import { useState } from 'react';
import { CreditCard, Download } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import {
  AdminDataTable,
  AdminPagination,
  AdminStatsRow,
  AdminFilterField,
  AdminToolbar,
} from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  useConfirmBankTransferMutation,
  useGetPaymentStatsQuery,
  useGetPaymentsQuery,
  useGetPaymentQuery,
  useRefundPaymentMutation,
  type PaymentMethod,
  type PaymentRecord,
} from '@/store/api/paymentApi';
import { ApiErrorAlert } from '@/components/common/ApiErrorAlert';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime, formatVND, vi } from '@/lib/i18n';
import { useRouter, useSearchParams } from 'next/navigation';

const STATUS_OPTIONS = [
  { value: '', label: vi.admin.all },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'PAID', label: 'Paid' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REFUNDED', label: 'Refunded' },
];

const METHOD_OPTIONS: { value: PaymentMethod | ''; label: string }[] = [
  { value: '', label: vi.admin.all },
  { value: 'COD', label: vi.payment.methods.cod },
  { value: 'BANK_TRANSFER', label: vi.payment.methods.bank },
  { value: 'VNPAY', label: vi.payment.methods.vnpay },
  { value: 'MOMO', label: vi.payment.methods.momo },
];

export function AdminPaymentsTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Number(searchParams.get('limit')) || 10;
  const status = searchParams.get('status') ?? '';
  const method = searchParams.get('method') ?? '';
  const dateFrom = searchParams.get('dateFrom') ?? '';
  const dateTo = searchParams.get('dateTo') ?? '';
  const search = searchParams.get('search') ?? '';

  const [searchInput, setSearchInput] = useState(search);
  const [detailId, setDetailId] = useState<string | null>(null);

  const push = (patch: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    if (!patch.page) p.delete('page');
    router.push(`?${p.toString()}`, { scroll: false });
  };

  const { data: statsData, isLoading: statsLoading } = useGetPaymentStatsQuery();
  const { data, isLoading, isFetching, isError, refetch } = useGetPaymentsQuery({
    page,
    limit,
    status: status || undefined,
    method: (method as PaymentMethod) || undefined,
    search: search || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });
  const { data: detailData, isLoading: detailLoading, isError: detailError } =
    useGetPaymentQuery(detailId!, { skip: !detailId });
  const [confirmBank, { isLoading: confirming }] = useConfirmBankTransferMutation();
  const [refund, { isLoading: refunding }] = useRefundPaymentMutation();

  const payments = Array.isArray(data?.data) ? data.data : [];
  const meta = data?.meta;
  const payment = detailData?.data;
  const filterCount = [status, method, dateFrom, dateTo].filter(Boolean).length;

  const handleExport = () => {
    const rows = payments.map((p) =>
      [p.orderNumber, p.paymentMethodLabel, p.paymentStatusLabel, p.amount, p.transactionId, p.createdAt].join(','),
    );
    const csv = ['Order,Method,Status,Amount,Transaction ID,Date\n', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={vi.admin.payments}
        description={vi.admin.paymentsDesc}
        action={
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            {vi.admin.exportReport}
          </Button>
        }
      />

      <AdminStatsRow
        isLoading={statsLoading}
        columns={4}
        stats={[
          { label: vi.admin.totalPayments, value: statsData?.data?.total, icon: CreditCard },
          { label: vi.admin.successfulPayments, value: statsData?.data?.successful, icon: CreditCard, accent: 'success' },
          { label: vi.admin.failedPayments, value: statsData?.data?.failed, icon: CreditCard, accent: 'warning' },
          { label: vi.admin.refundedPayments, value: statsData?.data?.refunded, icon: CreditCard },
        ]}
      />

      <AdminToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={() => push({ search: searchInput, page: '1' })}
        searchPlaceholder={`${vi.admin.transactionId}, order code...`}
        filterCount={filterCount}
        onClearFilters={() =>
          push({ status: '', method: '', dateFrom: '', dateTo: '', page: '1' })
        }
        filters={
          <>
            <AdminFilterField label={vi.admin.filterPaymentStatus}>
              <Select
                className="h-10"
                value={status}
                onChange={(e) => push({ status: e.target.value, page: '1' })}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </AdminFilterField>
            <AdminFilterField label={vi.admin.filterPaymentMethod}>
              <Select
                className="h-10"
                value={method}
                onChange={(e) => push({ method: e.target.value, page: '1' })}
              >
                {METHOD_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
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

      <div className={isFetching ? 'opacity-70' : ''}>
        <AdminDataTable<PaymentRecord>
          data={payments}
          isLoading={isLoading}
          isError={isError}
          emptyMessage={vi.admin.noPayments}
          onRowClick={(r) => setDetailId(r.id)}
          columns={[
            { key: 'orderNumber', header: vi.order.orderCode },
            { key: 'transactionId', header: vi.admin.transactionId },
            { key: 'paymentMethodLabel', header: vi.admin.paymentMethod },
            {
              key: 'paymentStatus',
              header: vi.common.status,
              render: (r) => <Badge>{r.paymentStatusLabel}</Badge>,
            },
            {
              key: 'amount',
              header: vi.checkout.total,
              render: (r) => formatVND(r.amount),
            },
            {
              key: 'createdAt',
              header: vi.common.date,
              render: (r) => formatDateTime(r.createdAt),
            },
            {
              key: 'id',
              header: vi.common.actions,
              render: (r) => (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="outline" onClick={() => setDetailId(r.id)}>
                    {vi.admin.viewDetail}
                  </Button>
                  {r.paymentMethod === 'BANK_TRANSFER' && r.paymentStatus === 'PENDING' && (
                    <Button
                      size="sm"
                      disabled={confirming}
                      onClick={async () => {
                        await confirmBank({ id: r.id }).unwrap();
                        refetch();
                      }}
                    >
                      {vi.admin.confirmBank}
                    </Button>
                  )}
                  {r.paymentStatus === 'PAID' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={refunding}
                      onClick={async () => {
                        await refund({ id: r.id }).unwrap();
                        refetch();
                      }}
                    >
                      {vi.admin.refund}
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
      />

      <Sheet open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{vi.admin.paymentDetail}</SheetTitle>
          </SheetHeader>
          <SheetBody>
            {detailLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            ) : detailError ? (
              <ApiErrorAlert />
            ) : payment ? (
              <div className="space-y-4 text-sm">
                <p><strong>{vi.order.orderCode}:</strong> {payment.orderNumber}</p>
                <p><strong>{vi.admin.transactionId}:</strong> {payment.transactionId ?? '—'}</p>
                <p><strong>{vi.admin.paymentMethod}:</strong> {payment.paymentMethodLabel}</p>
                <p><strong>{vi.common.status}:</strong> {payment.paymentStatusLabel}</p>
                <p><strong>{vi.checkout.total}:</strong> {formatVND(payment.amount)}</p>
                <p><strong>{vi.common.date}:</strong> {formatDateTime(payment.createdAt)}</p>
              </div>
            ) : null}
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  );
}
