import { vi } from '@/lib/i18n';
import {
  getOptionDisplayLabel,
  normalizeVariantOptions,
  sortVariantOptionEntries,
} from '@/lib/variants';

interface VariantLineDetailsProps {
  variantOptions?: Record<string, string> | null;
  variantName?: string | null;
  sku?: string | null;
  className?: string;
  showSku?: boolean;
}

export function VariantLineDetails({
  variantOptions,
  variantName,
  sku,
  className = '',
  showSku = true,
}: VariantLineDetailsProps) {
  const options = normalizeVariantOptions(variantOptions, variantName);
  const entries = sortVariantOptionEntries(Object.entries(options));

  if (!entries.length && !sku) return null;

  return (
    <div className={`space-y-0.5 text-sm text-slate-600 ${className}`}>
      {entries.map(([key, value]) => (
        <p key={key}>
          <span className="text-slate-500">{getOptionDisplayLabel(key)}:</span>{' '}
          <span className="font-medium text-slate-800">{value}</span>
        </p>
      ))}
      {showSku && sku && (
        <p>
          <span className="text-slate-500">{vi.product.sku}:</span>{' '}
          <span className="font-medium text-slate-800">{sku}</span>
        </p>
      )}
    </div>
  );
}
