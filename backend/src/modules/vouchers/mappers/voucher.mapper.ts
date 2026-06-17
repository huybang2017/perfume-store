import { Voucher } from '../../../database/schema/vouchers';

export class VoucherMapper {
  static toResponse(voucher: Voucher) {
    return {
      ...voucher,
      value: Number(voucher.value),
      minOrderAmount: voucher.minOrderAmount
        ? Number(voucher.minOrderAmount)
        : null,
      maxDiscount: voucher.maxDiscount ? Number(voucher.maxDiscount) : null,
    };
  }

  static toResponseList(vouchers: Voucher[]) {
    return vouchers.map((v) => VoucherMapper.toResponse(v));
  }
}
