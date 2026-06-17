import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PaymentMethod,
  PaymentStatus,
} from '../../../common/constants/payment.constants';
import { Payment, PaymentHistory } from '../../../database/schema/payments';

export class PaymentMapper {
  static toResponse(
    payment: Payment,
    history: PaymentHistory[] = [],
    extras?: { orderNumber?: string; bankTransfer?: Record<string, string> },
  ) {
    const method = payment.paymentMethod as PaymentMethod;
    const status = payment.paymentStatus as PaymentStatus;
    return {
      id: payment.id,
      orderId: payment.orderId,
      orderNumber: extras?.orderNumber,
      paymentMethod: payment.paymentMethod,
      paymentMethodLabel:
        PAYMENT_METHOD_LABELS[method] ?? payment.paymentMethod,
      paymentStatus: payment.paymentStatus,
      paymentStatusLabel:
        PAYMENT_STATUS_LABELS[status] ?? payment.paymentStatus,
      amount: Number(payment.amount),
      transactionId: payment.transactionId,
      gatewayTransactionId: payment.gatewayTransactionId,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      bankTransfer: extras?.bankTransfer,
      history: history.map((h) => ({
        status: h.status,
        statusLabel:
          PAYMENT_STATUS_LABELS[h.status as PaymentStatus] ?? h.status,
        message: h.message,
        createdAt: h.createdAt,
      })),
    };
  }
}
