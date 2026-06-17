'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { vi } from '@/lib/i18n';

interface ShopSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function ShopSearchBar({ value, onChange }: ShopSearchBarProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="shop-search">{vi.shop.search}</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          id="shop-search"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={vi.shop.searchPlaceholder}
          className="pl-10 pr-10"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label={vi.shop.clearAll}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
