'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { formatVND, vi } from '@/lib/i18n';
import {
  COLOR_SWATCHES,
  formatSelectedCombination,
  getOptionSelectPrompt,
  isColorOption,
  isSizeOption,
  stockStatusMessage,
} from '@/lib/variants';
import type { Product, ProductVariant } from '@/types/api';

interface VariantSelectorProps {
  product: Product;
  onVariantChange: (variant: ProductVariant | null) => void;
  onSelectionChange?: (selection: Record<string, string>) => void;
}

export function VariantSelector({
  product,
  onVariantChange,
  onSelectionChange,
}: VariantSelectorProps) {
  const options = useMemo(() => product.options ?? [], [product.options]);
  const variants = useMemo(() => product.variants ?? [], [product.variants]);

  const [selected, setSelected] = useState<Record<string, string>>({});

  useEffect(() => {
    setSelected({});
  }, [product.id]);

  const matchedVariant = useMemo(() => {
    if (!variants.length) return null;
    if (!options.length) return variants.find((v) => v.isActive) ?? variants[0];
    const allChosen = options.every((o) => selected[o.name]);
    if (!allChosen) return null;
    return (
      variants.find((v) =>
        options.every((o) => v.options?.[o.name] === selected[o.name]),
      ) ?? null
    );
  }, [variants, options, selected]);

  useEffect(() => {
    onVariantChange(matchedVariant);
  }, [matchedVariant, onVariantChange]);

  useEffect(() => {
    onSelectionChange?.(selected);
  }, [selected, onSelectionChange]);

  const isValueAvailable = (optionName: string, value: string) => {
    return variants.some((v) => {
      if (v.options?.[optionName] !== value || !v.isActive) return false;
      return options.every((o) => {
        if (o.name === optionName) return true;
        const sel = selected[o.name];
        return !sel || v.options?.[o.name] === sel;
      });
    });
  };

  const isValueInStock = (optionName: string, value: string) => {
    return variants.some((v) => {
      if (v.options?.[optionName] !== value || !v.isActive || v.stock < 1) {
        return false;
      }
      return options.every((o) => {
        if (o.name === optionName) return true;
        const sel = selected[o.name];
        return !sel || v.options?.[o.name] === sel;
      });
    });
  };

  if (!options.length && variants.length <= 1) {
    const v = variants[0];
    if (!v) return null;
    return (
      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
        <p>
          <span className="text-slate-500">{vi.product.sku}:</span>{' '}
          <span className="font-medium text-slate-900">{v.sku}</span>
        </p>
        <p>
          <span className="text-slate-500">{vi.product.stock}:</span>{' '}
          <span
            className={cn(
              'font-medium',
              v.stock < 1 ? 'text-red-600' : 'text-slate-900',
            )}
          >
            {stockStatusMessage(v.stock)}
          </span>
        </p>
      </div>
    );
  }

  const selectedSummary = formatSelectedCombination(selected);
  const allOptionsChosen = options.every((o) => selected[o.name]);

  return (
    <div className="space-y-6">
      {options.map((opt) => {
        const chosen = selected[opt.name];
        const isColor = isColorOption(opt.name);
        const isSize = isSizeOption(opt.name);

        return (
          <div key={opt.id}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">{opt.name}</p>
              {!chosen && (
                <p className="text-xs text-amber-700">{getOptionSelectPrompt(opt.name)}</p>
              )}
            </div>
            <div
              className={cn(
                'flex flex-wrap gap-2',
                isColor && 'gap-2.5',
              )}
            >
              {(Array.isArray(opt.values) ? opt.values : []).map((val) => {
                const active = chosen === val.value;
                const available = isValueAvailable(opt.name, val.value);
                const inStock = isValueInStock(opt.name, val.value);
                const disabled = !available;
                const outOfCombo = available && !inStock;

                if (isColor) {
                  const swatch = COLOR_SWATCHES[val.value] ?? '#cbd5e1';
                  return (
                    <button
                      key={val.id}
                      type="button"
                      disabled={disabled}
                      title={
                        outOfCombo
                          ? vi.product.combinationUnavailable
                          : val.value
                      }
                      onClick={() =>
                        setSelected((s) => ({ ...s, [opt.name]: val.value }))
                      }
                      className={cn(
                        'group relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                        active
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-slate-200 hover:border-slate-400',
                        disabled && 'cursor-not-allowed opacity-35',
                        outOfCombo && !disabled && 'opacity-50',
                      )}
                      aria-label={val.value}
                    >
                      <span
                        className="h-7 w-7 rounded-full border border-black/10 shadow-inner"
                        style={{ backgroundColor: swatch }}
                      />
                      {outOfCombo && (
                        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <span className="h-px w-full rotate-45 bg-slate-500" />
                        </span>
                      )}
                    </button>
                  );
                }

                return (
                  <button
                    key={val.id}
                    type="button"
                    disabled={disabled}
                    title={
                      outOfCombo ? vi.product.combinationUnavailable : undefined
                    }
                    onClick={() =>
                      setSelected((s) => ({ ...s, [opt.name]: val.value }))
                    }
                    className={cn(
                      'min-w-[2.75rem] rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                      isSize && 'min-w-[3rem]',
                      active
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300',
                      disabled && 'cursor-not-allowed opacity-35 line-through',
                      outOfCombo &&
                        !disabled &&
                        'opacity-60 line-through decoration-slate-500',
                    )}
                  >
                    {val.value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {allOptionsChosen && selectedSummary && (
        <p className="text-sm text-slate-700">
          <span className="font-medium text-slate-900">{vi.product.selectedVariant}:</span>{' '}
          {selectedSummary}
        </p>
      )}

      {allOptionsChosen && !matchedVariant && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {vi.product.combinationUnavailable}
        </p>
      )}
    </div>
  );
}
