'use client';

import { MessageSquare, Star } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { AdminStatsRow } from '@/components/admin/AdminStatsRow';
import { AdminFilterField, AdminToolbar } from '@/components/admin';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  useGetAdminReviewsQuery,
  useGetReviewStatsQuery,
  useSetReviewStatusMutation,
  useDeleteReviewMutation,
} from '@/store/api/reviewApi';
import { vi } from '@/lib/i18n';

interface AdminReviewRow {
  id: string;
  productName?: string;
  userName?: string;
  rating: number;
  comment?: string | null;
  status: string;
  createdAt: string;
}

export function AdminReviewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Number(searchParams.get('limit')) || 10;
  const status = searchParams.get('status') ?? '';
  const rating = searchParams.get('rating') ?? '';
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const push = (patch: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    router.push(`?${p.toString()}`, { scroll: false });
  };

  const { data, isLoading, isError } = useGetAdminReviewsQuery({
    page,
    limit,
    search: searchParams.get('search') || undefined,
    status: status || undefined,
    rating: rating ? Number(rating) : undefined,
  });
  const { data: statsData, isLoading: statsLoading } = useGetReviewStatsQuery();
  const [setStatus] = useSetReviewStatusMutation();
  const [deleteReview] = useDeleteReviewMutation();

  const rows = (Array.isArray(data?.data) ? data.data : []) as AdminReviewRow[];

  return (
    <div>
      <PageHeader title={vi.admin.reviews} description={vi.admin.reviewsDesc} />
      <AdminStatsRow
        isLoading={statsLoading}
        columns={3}
        stats={[
          { label: vi.admin.totalReviews, value: statsData?.data?.total, icon: MessageSquare },
          { label: vi.admin.pendingReviews, value: statsData?.data?.pending, icon: Star, accent: 'warning' },
          { label: vi.admin.approvedReviews, value: statsData?.data?.approved, icon: Star, accent: 'success' },
        ]}
      />
      <AdminToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={() => push({ search: searchInput, page: '1' })}
        filterCount={[status, rating].filter(Boolean).length}
        onClearFilters={() => push({ status: '', rating: '', page: '1' })}
        filters={
          <>
            <AdminFilterField label={vi.admin.approvalStatus}>
              <Select
                className="h-10"
                value={status}
                onChange={(e) => push({ status: e.target.value, page: '1' })}
              >
                <option value="">{vi.admin.all}</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </Select>
            </AdminFilterField>
            <AdminFilterField label={vi.admin.rating}>
              <Select
                className="h-10"
                value={rating}
                onChange={(e) => push({ rating: e.target.value, page: '1' })}
              >
                <option value="">{vi.admin.all}</option>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={String(n)}>
                    {'★'.repeat(n)} ({n})
                  </option>
                ))}
              </Select>
            </AdminFilterField>
          </>
        }
      />
      <AdminDataTable<AdminReviewRow>
        data={rows}
        isLoading={isLoading}
        isError={isError}
        emptyMessage={vi.product.noReviews}
        columns={[
          { key: 'productName', header: 'Product' },
          { key: 'userName', header: 'Customer' },
          {
            key: 'rating',
            header: vi.admin.rating,
            render: (r) => '★'.repeat(Math.max(0, Math.min(5, r.rating ?? 0))),
          },
          {
            key: 'status',
            header: vi.common.status,
            render: (r) => {
              const labels: Record<string, string> = {
                pending: 'Pending',
                approved: 'Approved',
                rejected: 'Rejected',
              };
              return <Badge>{labels[r.status] ?? r.status}</Badge>;
            },
          },
          {
            key: 'comment',
            header: 'Content',
            render: (r) => (
              <span className="line-clamp-2 max-w-xs text-slate-600">{r.comment ?? '—'}</span>
            ),
          },
          {
            key: 'id',
            header: vi.common.actions,
            render: (r) => (
              <div className="flex gap-1">
                {r.status === 'pending' && (
                  <>
                    <Button size="sm" onClick={() => setStatus({ id: r.id, status: 'approved' })}>
                      {vi.admin.approve}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setStatus({ id: r.id, status: 'rejected' })}
                    >
                      {vi.admin.reject}
                    </Button>
                  </>
                )}
                <Button size="sm" variant="ghost" onClick={() => setDeleteId(r.id)}>
                  {vi.admin.delete}
                </Button>
              </div>
            ),
          },
        ]}
      />
      <AdminPagination
        page={page}
        totalPages={data?.meta?.totalPages ?? 1}
        totalItems={data?.meta?.total ?? 0}
        pageSize={limit}
        onPageChange={(p) => push({ page: String(p) })}
        onPageSizeChange={(size) => push({ limit: String(size), page: '1' })}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title={vi.admin.confirmDelete}
        onConfirm={async () => {
          if (deleteId) await deleteReview(deleteId);
        }}
      />
    </div>
  );
}
