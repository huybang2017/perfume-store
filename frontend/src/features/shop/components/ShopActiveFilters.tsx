'use client';

import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatVND, vi } from '@/lib/i18n';
import type { Brand, Category } from '@/types/api';
import type { ShopFiltersState } from '@/types/shop';

interface ShopActiveFiltersProps {
  filters: ShopFiltersState;
  categories: Category[];
  brands: Brand[];
  onRemove: (patch: Partial<ShopFiltersState>) => void;
  onClearAll: () => void;
}

export function ShopActiveFilters({
  filters,
  categories,
  brands,
  onRemove,
  onClearAll,
}: ShopActiveFiltersProps) {
  const chips: { key: string; label: string; clear: () => void }[] = [];

  if (filters.q) {
    chips.push({
      key: 'q',
      label: `"${filters.q}"`,
      clear: () => onRemove({ q: '', page: 1 }),
    });
  }

  if (filters.category) {
    const name = categories.find((c) => c.slug === filters.category)?.name ?? filters.category;
    chips.push({
      key: 'cat',
      label: name,
      clear: () => onRemove({ category: '', page: 1 }),
    });
  }

  filters.brands.forEach((slug) => {
    const name = brands.find((b) => b.slug === slug)?.name ?? slug;
    chips.push({
      key: `brand-${slug}`,
      label: name,
      clear: () =>
        onRemove({
          brands: filters.brands.filter((b) => b !== slug),
          page: 1,
        }),
    });
  });

  filters.colors.forEach((color) => {
    chips.push({
      key: `color-${color}`,
      label: `${vi.shop.color}: ${color}`,
      clear: () =>
        onRemove({
          colors: filters.colors.filter((c) => c !== color),
          page: 1,
        }),
    });
  });

  filters.sizes.forEach((size) => {
    chips.push({
      key: `size-${size}`,
      label: `${vi.shop.size}: ${size}`,
      clear: () =>
        onRemove({
          sizes: filters.sizes.filter((s) => s !== size),
          page: 1,
        }),
    });
  });

  if (filters.minPrice || filters.maxPrice) {
    const min = filters.minPrice ? formatVND(Number(filters.minPrice)) : '0 ₫';
    const max = filters.maxPrice ? formatVND(Number(filters.maxPrice)) : '∞';
    chips.push({
      key: 'price',
      label: `${min} – ${max}`,
      clear: () => onRemove({ minPrice: '', maxPrice: '', page: 1 }),
    });
  }

  if (filters.inStock === 'true') {
    chips.push({
      key: 'stock',
      label: vi.shop.inStock,
      clear: () => onRemove({ inStock: '', page: 1 }),
    });
  } else if (filters.inStock === 'false') {
    chips.push({
      key: 'stock',
      label: vi.shop.outOfStock,
      clear: () => onRemove({ inStock: '', page: 1 }),
    });
  }

  if (filters.featured === 'true') {
    chips.push({
      key: 'feat',
      label: vi.shop.featuredOnly,
      clear: () => onRemove({ featured: '', page: 1 }),
    });
  } else if (filters.featured === 'false') {
    chips.push({
      key: 'feat',
      label: vi.shop.normalOnly,
      clear: () => onRemove({ featured: '', page: 1 }),
    });
  }

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Badge
          key={chip.key}
          variant="default"
          className="gap-1 bg-amber-50 pr-1 text-amber-700 hover:bg-amber-100 ring-1 ring-amber-200"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.clear}
            className="rounded p-0.5 hover:bg-amber-200/60"
            aria-label={`${vi.common.delete} ${chip.label}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Button variant="ghost" size="sm" onClick={onClearAll} className="h-7 text-xs">
        {vi.shop.clearAll}
      </Button>
    </div>
  );
}
