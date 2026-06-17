const vndFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'VND',
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

const numberFormatter = new Intl.NumberFormat('en-US');

/** Format amount as VND (e.g. ₫299,000) */
export function formatVND(amount: number): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return vndFormatter.format(0);
  return vndFormatter.format(Math.round(value));
}

/** Price range for products with variants (e.g. 250.000 ₫ - 350.000 ₫) */
export function formatPriceRange(min: number, max: number): string {
  if (min === max) return formatVND(min);
  return `${formatVND(min)} - ${formatVND(max)}`;
}

/** e.g. Jan 15, 2026 */
export function formatDate(value: string | Date): string {
  return dateFormatter.format(new Date(value));
}

/** e.g. Jan 15, 2026, 3:30 PM */
export function formatDateTime(value: string | Date): string {
  return dateTimeFormatter.format(new Date(value));
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** Voucher display: percentage or fixed VND */
export function formatVoucherValue(type: 'percentage' | 'fixed', value: number): string {
  return type === 'percentage' ? `${value}%` : formatVND(value);
}
