'use client';

import { ApiErrorAlert } from '@/components/common/ApiErrorAlert';
import { EmptyState } from '@/components/common/EmptyState';
import { vi } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export interface AdminColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface AdminDataTableProps<T extends { id: string }> {
  columns: AdminColumn<T>[];
  data: T[];
  isLoading?: boolean;
  isError?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  selectedIds?: Set<string>;
  onSelectAll?: (checked: boolean) => void;
  onSelectRow?: (id: string, checked: boolean) => void;
  onRowClick?: (row: T) => void;
  bulkBar?: React.ReactNode;
}

export function AdminDataTable<T extends { id: string }>({
  columns,
  data,
  isLoading,
  isError,
  emptyMessage = vi.admin.noData,
  emptyDescription,
  selectedIds,
  onSelectAll,
  onSelectRow,
  onRowClick,
  bulkBar,
}: AdminDataTableProps<T>) {
  const selectable = !!onSelectRow;
  const allSelected =
    selectable && data.length > 0 && data.every((r) => selectedIds?.has(r.id));

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="animate-pulse">
          <div className="h-11 bg-slate-50" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 border-t border-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <ApiErrorAlert />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <EmptyState title={emptyMessage} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {bulkBar && selectedIds && selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-blue-100 bg-blue-50 px-4 py-3">
          <span className="text-sm font-medium text-blue-800">
            {vi.admin.selectedCount.replace('{n}', String(selectedIds.size))}
          </span>
          {bulkBar}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
            <tr className="border-b border-slate-200">
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'bg-white transition-colors hover:bg-slate-50/80',
                  onRowClick && 'cursor-pointer',
                  selectedIds?.has(row.id) && 'bg-blue-50/40',
                )}
              >
                {selectable && (
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds?.has(row.id)}
                      onChange={(e) => onSelectRow?.(row.id, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn('px-4 py-3.5 text-slate-800', col.className)}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
