'use client';

import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { vi } from '@/lib/i18n';
import type { ShopSort } from '@/types/shop';

interface ShopSortSelectProps {
  value: ShopSort;
  onChange: (value: ShopSort) => void;
}

export function ShopSortSelect({ value, onChange }: ShopSortSelectProps) {
  return (
    <div className="min-w-[200px] space-y-2">
      <Label htmlFor="shop-sort">{vi.shop.sort}</Label>
      <Select
        id="shop-sort"
        value={value}
        onChange={(e) => onChange(e.target.value as ShopSort)}
      >
        <option value="newest">{vi.shop.sortNewest}</option>
        <option value="price_asc">{vi.shop.sortPriceAsc}</option>
        <option value="price_desc">{vi.shop.sortPriceDesc}</option>
        <option value="best_selling">{vi.shop.sortBestSelling}</option>
        <option value="featured">{vi.shop.sortFeatured}</option>
      </Select>
    </div>
  );
}
