'use client';

import { EmptyState } from './EmptyState';
import { vi } from '@/lib/i18n';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  emptyDescription?: string;
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends object>({
  columns,
  data,
  emptyMessage = vi.admin.noData,
  emptyDescription,
  isLoading,
  onRowClick,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-[var(--shadow-sm)]">
        <div className="animate-pulse space-y-0">
          <div className="h-12 bg-surface" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 border-t border-border-subtle bg-white" />
          ))}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <EmptyState
        title={emptyMessage}
        description={emptyDescription ?? vi.shop.noProductsDesc}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-[var(--shadow-sm)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border-subtle bg-surface">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-text-secondary"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {data.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(row)}
                className={
                  onRowClick
                    ? 'cursor-pointer bg-white transition-colors hover:bg-primary/[0.03]'
                    : 'bg-white transition-colors hover:bg-surface/80'
                }
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={`px-5 py-4 text-text-primary ${col.className ?? ''}`}
                  >
                    {col.render
                      ? col.render(row)
                      : String(row[col.key as keyof T] ?? '')}
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
