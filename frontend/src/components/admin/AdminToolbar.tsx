'use client';

import { useState } from 'react';
import { Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { AdminFilterField } from '@/components/admin/AdminFilterField';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { vi } from '@/lib/i18n';

interface SortOption {
  value: string;
  label: string;
}

interface AdminToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  onSearchSubmit?: () => void;
  searchPlaceholder?: string;
  sortValue?: string;
  sortOptions?: SortOption[];
  onSortChange?: (v: string) => void;
  filters?: React.ReactNode;
  filterCount?: number;
  onClearFilters?: () => void;
  actions?: React.ReactNode;
}

export function AdminToolbar({
  search,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = vi.admin.searchPlaceholder,
  sortValue,
  sortOptions,
  onSortChange,
  filters,
  filterCount = 0,
  onClearFilters,
  actions,
}: AdminToolbarProps) {
  const [mobileFilters, setMobileFilters] = useState(false);

  return (
    <div className="sticky top-0 z-20 -mx-1 mb-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="h-10 pl-9"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit?.()}
          />
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>

      {(sortOptions || filters) && (
        <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-3">
          {sortOptions && onSortChange && (
            <AdminFilterField label={vi.admin.sort} controlClassName="min-w-[11rem]">
              <Select
                className="h-10"
                value={sortValue}
                onChange={(e) => onSortChange(e.target.value)}
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </AdminFilterField>
          )}
          {filters && (
            <>
              <Button
                variant="outline"
                className="h-10 lg:hidden"
                onClick={() => setMobileFilters(true)}
              >
                <Filter className="mr-2 h-4 w-4" />
                {vi.admin.filters}
                {filterCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-blue-600 px-1.5 py-0.5 text-xs text-white">
                    {filterCount}
                  </span>
                )}
              </Button>
              <div className="hidden flex-wrap items-end gap-3 lg:flex">{filters}</div>
            </>
          )}
        </div>
      )}
      {filterCount > 0 && onClearFilters && (
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onClearFilters}>
          {vi.admin.clearFilters}
        </Button>
      )}
      {filters && (
        <Sheet open={mobileFilters} onOpenChange={setMobileFilters}>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>{vi.admin.filters}</SheetTitle>
            </SheetHeader>
            <SheetBody className="flex flex-col gap-4">{filters}</SheetBody>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
