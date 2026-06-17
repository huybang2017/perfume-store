import {
  Order,
  OrderItem,
  OrderStatusHistory,
} from '../../../database/schema/orders';

const TIMELINE_STEPS: Order['status'][] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
];

const TIMELINE_NOTES: Record<string, string> = {
  pending: 'Order placed',
  confirmed: 'Order confirmed',
  processing: 'Order is being packed',
  shipped: 'Order handed to carrier',
  delivered: 'Delivered successfully',
  cancelled: 'Order cancelled',
};

export class OrderMapper {
  static buildStatusHistory(order: Order, rows: OrderStatusHistory[] = []) {
    if (rows.length) {
      return rows.map((r) => ({
        status: r.status,
        createdAt: r.createdAt,
        note: r.note,
      }));
    }
    if (order.status === 'cancelled') {
      return [
        {
          status: 'pending' as const,
          createdAt: order.createdAt,
          note: TIMELINE_NOTES.pending,
        },
        {
          status: 'cancelled' as const,
          createdAt: order.updatedAt,
          note: order.cancelReason ?? TIMELINE_NOTES.cancelled,
        },
      ];
    }
    const idx = TIMELINE_STEPS.indexOf(order.status);
    return TIMELINE_STEPS.slice(0, idx + 1).map((status, i) => ({
      status,
      createdAt: i === idx ? order.updatedAt : order.createdAt,
      note: TIMELINE_NOTES[status],
    }));
  }

  static paymentLabels(order: Order) {
    const methodKey = (order.paymentMethod ?? 'cod').toLowerCase();
    const methodMap: Record<string, string> = {
      cod: 'Cash on delivery',
      bank_transfer: 'Bank transfer',
      vnpay: 'VNPay',
      momo: 'MoMo',
    };
    const statusMap: Record<string, string> = {
      unpaid: 'Unpaid',
      pending: 'Awaiting confirmation',
      processing: 'Payment processing',
      paid: 'Paid',
      failed: 'Payment failed',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
    };
    return {
      paymentMethod:
        methodMap[methodKey] ??
        order.paymentMethod ??
        'Cash on delivery',
      paymentStatus: statusMap[order.paymentStatus] ?? 'Unpaid',
    };
  }

  static toResponse(
    order: Order,
    items: OrderItem[] = [],
    statusHistory: OrderStatusHistory[] = [],
    extras?: { itemCount?: number },
  ) {
    const payments = this.paymentLabels(order);
    return {
      ...order,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount ?? 0),
      shippingFee: Number(order.shippingFee ?? 0),
      total: Number(order.total),
      ...payments,
      itemCount: extras?.itemCount ?? items.length,
      items: items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        variant: item.variantName ?? undefined,
      })),
      statusHistory: this.buildStatusHistory(order, statusHistory),
    };
  }

  static toResponseList(
    entries: {
      order: Order;
      itemCount: number;
      previewItems: OrderItem[];
    }[],
  ) {
    return entries.map(({ order, itemCount, previewItems }) => ({
      ...this.toResponse(order, previewItems, [], { itemCount }),
    }));
  }
}
