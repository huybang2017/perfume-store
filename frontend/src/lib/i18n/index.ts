import { en } from './en';

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
