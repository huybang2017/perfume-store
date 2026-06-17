'use client';

import { useState } from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { vi } from '@/lib/i18n';

interface FilterPanelProps {
  children: React.ReactNode;
  filterCount?: number;
  onClear?: () => void;
}

export function FilterPanel({ children, filterCount = 0, onClear }: FilterPanelProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        className="lg:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <Filter className="mr-2 h-4 w-4" />
        {vi.admin.filters}
        {filterCount > 0 && (
          <span className="ml-1.5 rounded-full bg-blue-600 px-1.5 py-0.5 text-xs text-white">
            {filterCount}
          </span>
        )}
      </Button>
      <div className="hidden flex-wrap items-end gap-3 lg:flex">{children}</div>
      {filterCount > 0 && onClear && (
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onClear}>
          {vi.admin.clearFilters}
        </Button>
      )}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>{vi.admin.filters}</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-4">{children}</SheetBody>
        </SheetContent>
      </Sheet>
    </>
  );
}
