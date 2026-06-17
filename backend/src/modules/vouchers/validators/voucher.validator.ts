import { BusinessException } from '../../../common/exceptions/business.exception';
import { MSG } from '../../../common/i18n/messages.en';
import { Voucher } from '../../../database/schema/vouchers';

export class VoucherValidator {
  static assertUsable(voucher: Voucher, orderAmount: number): void {
    if (!voucher.isActive) {
      throw new BusinessException(MSG.VOUCHER_INACTIVE);
    }

    const now = new Date();
    if (voucher.startsAt && new Date(voucher.startsAt) > now) {
      throw new BusinessException(MSG.VOUCHER_NOT_ACTIVE_YET);
    }
    if (voucher.expiresAt && new Date(voucher.expiresAt) < now) {
      throw new BusinessException(MSG.VOUCHER_EXPIRED);
    }

    if (
      voucher.usageLimit != null &&
      (voucher.usedCount ?? 0) >= voucher.usageLimit
    ) {
      throw new BusinessException(MSG.VOUCHER_LIMIT_REACHED);
    }

    const minAmount = voucher.minOrderAmount
      ? Number(voucher.minOrderAmount)
      : 0;
    if (orderAmount < minAmount) {
      throw new BusinessException(MSG.VOUCHER_MIN_ORDER);
    }
  }

  static calculateDiscount(voucher: Voucher, orderAmount: number): number {
    const value = Number(voucher.value);
    let discount =
      voucher.type === 'percentage' ? (orderAmount * value) / 100 : value;

    const maxDiscount = voucher.maxDiscount
      ? Number(voucher.maxDiscount)
      : null;
    if (maxDiscount != null && discount > maxDiscount) {
      discount = maxDiscount;
    }

    return Math.min(discount, orderAmount);
  }
}
