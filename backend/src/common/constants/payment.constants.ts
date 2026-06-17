export enum PaymentMethod {
  COD = 'COD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  VNPAY = 'VNPAY',
  MOMO = 'MOMO',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.COD]: 'Cash on delivery',
  [PaymentMethod.BANK_TRANSFER]: 'Bank transfer',
  [PaymentMethod.VNPAY]: 'VNPay',
  [PaymentMethod.MOMO]: 'MoMo',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Pending payment',
  [PaymentStatus.PROCESSING]: 'Processing',
  [PaymentStatus.PAID]: 'Paid',
  [PaymentStatus.FAILED]: 'Payment failed',
  [PaymentStatus.CANCELLED]: 'Cancelled',
  [PaymentStatus.REFUNDED]: 'Refunded',
};
