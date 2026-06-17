'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { formatVND, vi } from '@/lib/i18n';
import type { Brand, Category } from '@/types/api';
import type { ShopFiltersState } from '@/types/shop';

interface ShopFiltersPanelProps {
  filters: ShopFiltersState;
  categories: Category[];
  brands: Brand[];
  colors?: string[];
  sizes?: string[];
  categoriesLoading?: boolean;
  brandsLoading?: boolean;
  onChange: (patch: Partial<ShopFiltersState>) => void;
  onClear: () => void;
  showActions?: boolean;
  onApply?: () => void;
}

export function ShopFiltersPanel({
  filters,
  categories,
  brands,
  colors = [],
  sizes = [],
  categoriesLoading,
  brandsLoading,
  onChange,
  onClear,
  showActions,
  onApply,
}: ShopFiltersPanelProps) {
  const min = filters.minPrice ? Number(filters.minPrice) : undefined;
  const max = filters.maxPrice ? Number(filters.maxPrice) : undefined;
  const priceInvalid =
    min != null &&
    max != null &&
    !Number.isNaN(min) &&
    !Number.isNaN(max) &&
    min > max;

  const toggleBrand = (slug: string) => {
    const next = filters.brands.includes(slug)
      ? filters.brands.filter((b) => b !== slug)
      : [...filters.brands, slug];
    onChange({ brands: next, page: 1 });
  };

  const toggleList = (
    key: 'colors' | 'sizes',
    value: string,
  ) => {
    const list = filters[key];
    const next = list.includes(value)
      ? list.filter((v) => v !== value)
      : [...list, value];
    onChange({ [key]: next, page: 1 } as Partial<ShopFiltersState>);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="filter-category">{vi.shop.category}</Label>
        {categoriesLoading ? (
          <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
        ) : (
          <Select
            id="filter-category"
            value={filters.category}
            onChange={(e) => onChange({ category: e.target.value, page: 1 })}
          >
            <option value="">{vi.shop.allCategories}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      <div className="space-y-3">
        <Label>{vi.shop.brand}</Label>
        {brandsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : brands.length === 0 ? (
          <p className="text-sm text-slate-500">{vi.common.noData}</p>
        ) : (
          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {brands.map((b) => (
              <label
                key={b.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={filters.brands.includes(b.slug)}
                  onChange={() => toggleBrand(b.slug)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-700">{b.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {colors.length > 0 && (
        <div className="space-y-3">
          <Label>{vi.shop.color}</Label>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleList('colors', c)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  filters.colors.includes(c)
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div className="space-y-3">
          <Label>{vi.shop.size}</Label>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleList('sizes', s)}
                className={`min-w-[2.5rem] rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  filters.sizes.includes(s)
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>{vi.shop.price}</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            min={0}
            step={1000}
            placeholder={vi.shop.minPrice}
            value={filters.minPrice}
            onChange={(e) => onChange({ minPrice: e.target.value, page: 1 })}
          />
          <Input
            type="number"
            min={0}
            step={1000}
            placeholder={vi.shop.maxPrice}
            value={filters.maxPrice}
            onChange={(e) => onChange({ maxPrice: e.target.value, page: 1 })}
          />
        </div>
        {priceInvalid && (
          <p className="text-xs text-red-600">{vi.shop.priceInvalid}</p>
        )}
        {min != null && !Number.isNaN(min) && max != null && !Number.isNaN(max) && !priceInvalid && (
          <p className="text-xs text-slate-500">
            {formatVND(min)} – {formatVND(max)}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-stock">{vi.shop.stock}</Label>
        <Select
          id="filter-stock"
          value={filters.inStock}
          onChange={(e) =>
            onChange({
              inStock: e.target.value as ShopFiltersState['inStock'],
              page: 1,
            })
          }
        >
          <option value="">{vi.shop.stockAll}</option>
          <option value="true">{vi.shop.inStock}</option>
          <option value="false">{vi.shop.outOfStock}</option>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-featured">{vi.shop.featured}</Label>
        <Select
          id="filter-featured"
          value={filters.featured}
          onChange={(e) =>
            onChange({
              featured: e.target.value as ShopFiltersState['featured'],
              page: 1,
            })
          }
        >
          <option value="">{vi.shop.featuredAll}</option>
          <option value="true">{vi.shop.featuredOnly}</option>
          <option value="false">{vi.shop.normalOnly}</option>
        </Select>
      </div>

      {showActions && (
        <div className="flex gap-2 border-t border-slate-200 pt-4">
          <Button variant="outline" className="flex-1" onClick={onClear}>
            {vi.shop.clearFilters}
          </Button>
          {onApply && (
            <Button className="flex-1" onClick={onApply}>
              {vi.shop.applyFilters}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
