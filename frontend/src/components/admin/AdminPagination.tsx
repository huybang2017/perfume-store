'use client';

import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { vi } from '@/lib/i18n';

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  isLoading?: boolean;
}

export function AdminPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading,
}: AdminPaginationProps) {
  if (totalPages <= 1 && !onPageSizeChange) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between rounded-b-2xl">
      <p className="text-sm text-slate-600">
        {vi.admin.showing}{' '}
        <span className="font-medium text-slate-900">
          {totalItems === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)}
        </span>{' '}
        {vi.admin.of} <span className="font-medium text-slate-900">{totalItems}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {onPageSizeChange && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>{vi.admin.perPage}</span>
            <Select
              className="h-9 w-20"
              value={String(pageSize)}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || isLoading}
          onClick={() => onPageChange(page - 1)}
        >
          {vi.admin.prevPage}
        </Button>
        <span className="min-w-[4rem] text-center text-sm text-slate-600">
          {vi.admin.page} {page}/{Math.max(1, totalPages)}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages || isLoading}
          onClick={() => onPageChange(page + 1)}
        >
          {vi.admin.nextPage}
        </Button>
      </div>
    </div>
  );
}
