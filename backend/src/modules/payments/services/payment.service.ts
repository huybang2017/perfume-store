import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import {
  PaymentMethod,
  PaymentStatus,
  PAYMENT_METHOD_LABELS,
} from '../../../common/constants/payment.constants';
import { OrderStatus } from '../../../common/constants';
import { MSG } from '../../../common/i18n/messages.en';
import { BusinessException } from '../../../common/exceptions/business.exception';
import {
  paginationMeta,
  successResponse,
} from '../../../common/utils/api-response.util';
import { VnpayGateway } from '../../../integrations/payment-gateways/vnpay.gateway';
import { MomoGateway } from '../../../integrations/payment-gateways/momo.gateway';
import { OrderService } from '../../orders/services/order.service';
import { OrderRepository } from '../../orders/repositories/order.repository';
import { VariantRepository } from '../../products/repositories/variant.repository';
import { CheckoutPaymentDto } from '../dto/checkout-payment.dto';
import { PaymentQueryDto } from '../dto/payment-query.dto';
import { PaymentRepository } from '../repositories/payment.repository';
import { PaymentMapper } from '../mappers/payment.mapper';
import { OrderMapper } from '../../orders/mappers/order.mapper';

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly orderService: OrderService,
    private readonly orderRepository: OrderRepository,
    private readonly variantRepository: VariantRepository,
    private readonly config: ConfigService,
    private readonly vnpay: VnpayGateway,
    private readonly momo: MomoGateway,
  ) {}

  async checkout(userId: string, dto: CheckoutPaymentDto, clientIp: string) {
    const orderRes = await this.orderService.checkout(userId, {
      shippingAddress: dto.shippingAddress,
      note: dto.note,
      voucherCode: dto.voucherCode,
      shippingFee: dto.shippingFee,
    });

    const order = orderRes.data;
    const result = await this.initializePayment(
      order.id,
      order.orderNumber,
      Number(order.total),
      dto.paymentMethod,
      clientIp,
    );

    const full = await this.orderRepository.findByIdWithItems(order.id);

    return successResponse(
      {
        order: OrderMapper.toResponse(
          full!.order,
          full!.items,
          full!.statusHistory,
        ),
        payment: result.payment,
        redirectUrl: result.redirectUrl,
        bankTransfer: result.bankTransfer,
      },
      MSG.ORDER_PLACED,
    );
  }

  private async initializePayment(
    orderId: string,
    orderNumber: string,
    amount: number,
    method: PaymentMethod,
    clientIp: string,
  ) {
    const paymentId = randomUUID();
    const transactionId = orderNumber;
    const idempotencyKey = `pay-${orderId}-${method}`;

    const existing =
      await this.paymentRepository.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      throw new BusinessException(
        'Payment has already been initialized for this order',
      );
    }

    let status = PaymentStatus.PENDING;
    let redirectUrl: string | undefined;
    let bankTransfer: Record<string, string> | undefined;
    let gatewayResponse: Record<string, unknown> | undefined;
    let orderPaymentStatus = 'unpaid';

    if (method === PaymentMethod.VNPAY || method === PaymentMethod.MOMO) {
      status = PaymentStatus.PROCESSING;
      orderPaymentStatus = 'processing';
    } else if (method === PaymentMethod.BANK_TRANSFER) {
      status = PaymentStatus.PENDING;
      orderPaymentStatus = 'pending';
    }

    const payment = await this.paymentRepository.create({
      id: paymentId,
      orderId,
      paymentMethod: method,
      paymentStatus: status,
      amount: String(amount),
      transactionId,
      idempotencyKey,
    });

    await this.paymentRepository.addHistory(
      payment.id,
      status,
      `Payment initialized: ${PAYMENT_METHOD_LABELS[method]}`,
    );

    const methodSlug: Record<PaymentMethod, string> = {
      [PaymentMethod.COD]: 'cod',
      [PaymentMethod.BANK_TRANSFER]: 'bank_transfer',
      [PaymentMethod.VNPAY]: 'vnpay',
      [PaymentMethod.MOMO]: 'momo',
    };
    await this.orderRepository.update(payment.orderId, {
      paymentMethod: methodSlug[method],
      paymentStatus: orderPaymentStatus as 'unpaid',
    });

    if (method === PaymentMethod.BANK_TRANSFER) {
      bankTransfer = {
        bankName: this.config.get<string>('payment.bankName')!,
        bankAccount: this.config.get<string>('payment.bankAccount')!,
        bankHolder: this.config.get<string>('payment.bankHolder')!,
        transferContent: orderNumber,
        amount: String(amount),
      };
      await this.paymentRepository.addHistory(
        payment.id,
        PaymentStatus.PENDING,
        'Awaiting customer bank transfer',
      );
    } else if (method === PaymentMethod.VNPAY) {
      if (this.vnpay.isConfigured()) {
        redirectUrl = this.vnpay.createPaymentUrl({
          amount,
          orderId,
          orderInfo: `Order payment ${orderNumber}`,
          ipAddr: clientIp,
          txnRef: transactionId,
        });
      } else {
        const frontend = this.config.get<string>('frontendUrl');
        redirectUrl = `${frontend}/thanh-toan/ket-qua?status=pending&orderId=${orderId}&method=VNPAY&demo=1`;
      }
    } else if (method === PaymentMethod.MOMO) {
      if (this.momo.isConfigured()) {
        const requestId = randomUUID();
        const momoRes = await this.momo.createPaymentRequest({
          amount,
          orderId,
          orderInfo: `Payment ${orderNumber}`,
          requestId,
        });
        redirectUrl = momoRes.payUrl;
        gatewayResponse = momoRes.raw;
        await this.paymentRepository.update(payment.id, {
          gatewayResponse,
          gatewayTransactionId: requestId,
        });
      } else {
        const frontend = this.config.get<string>('frontendUrl');
        redirectUrl = `${frontend}/thanh-toan/ket-qua?status=pending&orderId=${orderId}&method=MOMO&demo=1`;
      }
    }

    const history = await this.paymentRepository.getHistory(payment.id);
    const updated = (await this.paymentRepository.findById(payment.id))!;

    return {
      payment: PaymentMapper.toResponse(updated, history, {
        orderNumber,
        bankTransfer,
      }),
      redirectUrl,
      bankTransfer,
    };
  }

  async markPaid(
    payment: { id: string; orderId: string; paymentStatus: string },
    gatewayTxnId: string | null,
    message: string,
    gatewayResponse?: Record<string, unknown>,
  ) {
    if (payment.paymentStatus === PaymentStatus.PAID) {
      return payment;
    }

    await this.paymentRepository.update(payment.id, {
      paymentStatus: PaymentStatus.PAID,
      gatewayTransactionId: gatewayTxnId ?? undefined,
      gatewayResponse: gatewayResponse ?? undefined,
      paidAt: new Date(),
    });
    await this.paymentRepository.addHistory(
      payment.id,
      PaymentStatus.PAID,
      message,
    );
    await this.orderRepository.updateStatus(
      payment.orderId,
      OrderStatus.CONFIRMED,
      'Payment successful — order confirmed',
    );
    await this.orderRepository.update(payment.orderId, {
      paymentStatus: 'paid',
    });

    return this.paymentRepository.findById(payment.id);
  }

  async markFailed(paymentId: string, message: string) {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) return;

    if (payment.paymentStatus === PaymentStatus.PAID) return;

    await this.paymentRepository.update(paymentId, {
      paymentStatus: PaymentStatus.FAILED,
    });
    await this.paymentRepository.addHistory(
      paymentId,
      PaymentStatus.FAILED,
      message,
    );
    await this.orderRepository.update(payment.orderId, {
      paymentStatus: 'failed',
    });

    await this.releaseOrderStock(payment.orderId);
  }

  async refundPayment(paymentId: string, note?: string) {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) throw new BusinessException('Payment not found', 404);
    if (payment.paymentStatus !== PaymentStatus.PAID) {
      throw new BusinessException('Only completed payments can be refunded');
    }

    await this.paymentRepository.update(paymentId, {
      paymentStatus: PaymentStatus.REFUNDED,
    });
    await this.paymentRepository.addHistory(
      paymentId,
      PaymentStatus.REFUNDED,
      note ?? 'Refunded by admin',
    );
    await this.orderRepository.update(payment.orderId, {
      paymentStatus: 'refunded',
    });

    const updated = await this.paymentRepository.findById(paymentId);
    const history = await this.paymentRepository.getHistory(paymentId);
    const order = await this.orderRepository.findById(payment.orderId);
    return successResponse(
      PaymentMapper.toResponse(updated!, history, {
        orderNumber: order?.orderNumber,
      }),
      'Refunded',
    );
  }

  private async releaseOrderStock(orderId: string) {
    const full = await this.orderRepository.findByIdWithItems(orderId);
    if (!full) return;
    for (const item of full.items) {
      if (item.variantId) {
        await this.variantRepository.restoreStock(
          item.variantId,
          Number(item.quantity),
        );
      }
    }
  }

  async handleVnpayReturn(query: Record<string, string>) {
    const verified = this.vnpay.verifyCallback(query);
    const payment = await this.paymentRepository.findByTransactionId(
      verified.txnRef,
    );
    if (!payment) {
      return {
        success: false,
        orderId: null,
        message: 'Payment not found',
      };
    }

    const order = await this.orderRepository.findById(payment.orderId);

    if (verified.success && verified.valid) {
      if (Math.round(verified.amount) !== Math.round(Number(payment.amount))) {
        return {
          success: false,
          orderId: payment.orderId,
          orderNumber: order?.orderNumber,
          message: 'Payment amount mismatch',
        };
      }
      await this.markPaid(
        payment,
        query.vnp_TransactionNo ?? null,
        'VNPay payment successful',
        query,
      );
      return {
        success: true,
        orderId: payment.orderId,
        orderNumber: order?.orderNumber,
        message: 'Payment successful',
      };
    }

    await this.markFailed(
      payment.id,
      `VNPay declined: code ${verified.responseCode}`,
    );
    return {
      success: false,
      orderId: payment.orderId,
      orderNumber: order?.orderNumber,
      message: 'Payment failed',
    };
  }

  async handleVnpayIpn(query: Record<string, string>) {
    const result = await this.handleVnpayReturn(query);
    return { RspCode: result.success ? '00' : '99', Message: result.message };
  }

  async handleMomoIpn(body: Record<string, string>) {
    const verified = this.momo.verifyIpn(body);
    const payment = await this.paymentRepository.findByOrderId(
      verified.orderId,
    );
    if (!payment) {
      return { resultCode: 1006, message: 'Payment not found' };
    }

    if (verified.success && verified.valid) {
      if (Math.round(verified.amount) !== Math.round(Number(payment.amount))) {
        return { resultCode: 1007, message: 'Invalid amount' };
      }
      await this.markPaid(
        payment,
        body.transId ?? null,
        'MoMo payment successful',
        body,
      );
      return { resultCode: 0, message: 'Success' };
    }

    await this.markFailed(payment.id, `MoMo failed: ${body.message ?? ''}`);
    return { resultCode: 1001, message: 'Failed' };
  }

  async confirmBankTransfer(paymentId: string, adminNote?: string) {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) throw new BusinessException('Payment not found', 404);
    if (payment.paymentMethod !== PaymentMethod.BANK_TRANSFER) {
      throw new BusinessException('Only bank transfer payments can be confirmed');
    }
    if (payment.paymentStatus === PaymentStatus.PAID) {
      throw new BusinessException('Payment already confirmed');
    }

    await this.markPaid(
      payment,
      `BANK-${Date.now()}`,
      adminNote ?? 'Admin confirmed bank transfer received',
    );

    const updated = await this.paymentRepository.findById(paymentId);
    const history = await this.paymentRepository.getHistory(paymentId);
    const order = await this.orderRepository.findById(payment.orderId);
    return successResponse(
      PaymentMapper.toResponse(updated!, history, {
        orderNumber: order?.orderNumber,
      }),
      'Payment confirmed',
    );
  }

  async findByOrder(orderId: string, userId: string, role: string) {
    await this.orderService.findOne(orderId, userId, role);
    const payment = await this.paymentRepository.findByOrderId(orderId);
    if (!payment) throw new BusinessException('Payment not found', 404);
    const history = await this.paymentRepository.getHistory(payment.id);
    const order = await this.orderRepository.findById(orderId);
    return successResponse(
      PaymentMapper.toResponse(payment, history, {
        orderNumber: order?.orderNumber,
        bankTransfer:
          payment.paymentMethod === PaymentMethod.BANK_TRANSFER
            ? {
                bankName: this.config.get<string>('payment.bankName')!,
                bankAccount: this.config.get<string>('payment.bankAccount')!,
                bankHolder: this.config.get<string>('payment.bankHolder')!,
                transferContent: order?.orderNumber ?? '',
              }
            : undefined,
      }),
    );
  }

  async getStats() {
    const stats = await this.paymentRepository.getStats();
    return successResponse(stats, 'Payment statistics');
  }

  async findAll(query: PaymentQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { data, total } = await this.paymentRepository.findAll(query);
    const mapped = await Promise.all(
      data.map(async (p) => {
        const order = await this.orderRepository.findById(p.orderId);
        const history = await this.paymentRepository.getHistory(p.id);
        return PaymentMapper.toResponse(p, history, {
          orderNumber: order?.orderNumber,
        });
      }),
    );
    return successResponse(
      mapped,
      'Payments retrieved',
      paginationMeta(page, limit, total),
    );
  }

  async findOne(id: string) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) throw new BusinessException('Payment not found', 404);
    const history = await this.paymentRepository.getHistory(payment.id);
    const order = await this.orderRepository.findById(payment.orderId);
    return successResponse(
      PaymentMapper.toResponse(payment, history, {
        orderNumber: order?.orderNumber,
      }),
    );
  }

  async demoConfirmGateway(orderId: string, userId: string) {
    const payment = await this.paymentRepository.findByOrderId(orderId);
    if (!payment) throw new BusinessException('Payment not found', 404);
    const order = await this.orderRepository.findById(orderId);
    if (!order || order.userId !== userId) {
      throw new BusinessException(MSG.ORDER_NOT_FOUND, 404);
    }
    if (payment.paymentStatus === PaymentStatus.PAID) {
      return successResponse({ orderId }, 'Already paid');
    }
    await this.markPaid(
      payment,
      `DEMO-${Date.now()}`,
      'Demo payment confirmed',
    );
    return successResponse(
      { orderId, success: true },
      'Demo payment successful',
    );
  }
}
