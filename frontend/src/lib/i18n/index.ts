import { en } from './en';
import { vi } from './vi';

export {
  formatVND,
  formatPriceRange,
  formatDate,
  formatDateTime,
  formatNumber,
  formatVoucherValue,
} from './format';
export { en, en as vi };

/** Typed accessor for UI strings */
export function t<K extends keyof typeof en>(section: K): (typeof en)[K] {
  return en[section];
}
