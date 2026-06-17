import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { OrderStatus, UserRole } from '../../../common/constants';
import { MSG } from '../../../common/i18n/messages.en';
import { BusinessException } from '../../../common/exceptions/business.exception';
import {
  paginationMeta,
  successResponse,
} from '../../../common/utils/api-response.util';
import { CartService } from '../../carts/services/cart.service';
import { ProductRepository } from '../../products/repositories/product.repository';
import { VariantRepository } from '../../products/repositories/variant.repository';
import { VoucherService } from '../../vouchers/services/voucher.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { CancelOrderDto } from '../dto/cancel-order.dto';
import { OrderQueryDto } from '../dto/order-query.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { BulkOrderDto, OrderBulkAction } from '../dto/bulk-order.dto';
import { NewOrderItem } from '../../../database/schema/orders';
import { OrderMapper } from '../mappers/order.mapper';
import { OrderRepository } from '../repositories/order.repository';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly cartService: CartService,
    private readonly productRepository: ProductRepository,
    private readonly variantRepository: VariantRepository,
    private readonly voucherService: VoucherService,
  ) {}

  async findAll(query: OrderQueryDto, userId: string, role: string) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const isStaff = role === UserRole.ADMIN || role === UserRole.STAFF;
    const search = query.search ?? query.productSearch;
    const { data, total } = await this.orderRepository.findAll(
      { ...query, search, sortOrder: 'desc' },
      isStaff ? undefined : userId,
    );
    return successResponse(
      OrderMapper.toResponseList(data),
      MSG.ORDERS_RETRIEVED,
      paginationMeta(page, limit, total),
    );
  }

  async getMyStats(userId: string) {
    const stats = await this.orderRepository.getMyStats(userId);
    return successResponse(stats, MSG.ORDERS_RETRIEVED);
  }

  async getAdminStats() {
    const stats = await this.orderRepository.getAdminStats();
    return successResponse(stats, MSG.ORDERS_RETRIEVED);
  }

  async bulkAction(dto: BulkOrderDto) {
    for (const id of dto.ids) {
      if (dto.action === OrderBulkAction.CONFIRM) {
        await this.updateStatus(id, { status: OrderStatus.CONFIRMED });
      } else if (dto.action === OrderBulkAction.CANCEL) {
        const order = await this.orderRepository.findById(id);
        if (order && order.status !== OrderStatus.CANCELLED) {
          await this.cancel(id, order.userId, UserRole.ADMIN, {
            reason: 'Bulk cancelled by admin',
          });
        }
      }
    }
    return successResponse(null, 'Bulk update completed');
  }

  async findOne(id: string, userId: string, role: string) {
    const result = await this.orderRepository.findByIdWithItems(id);
    if (!result) throw new BusinessException(MSG.ORDER_NOT_FOUND, 404);

    const isStaff = role === UserRole.ADMIN || role === UserRole.STAFF;
    if (!isStaff && result.order.userId !== userId) {
      throw new BusinessException(MSG.ORDER_NOT_FOUND, 404);
    }

    return successResponse(
      OrderMapper.toResponse(result.order, result.items, result.statusHistory),
    );
  }

  async checkout(userId: string, dto: CreateOrderDto) {
    const { cart, items } =
      await this.cartService.getCartItemsForCheckout(userId);

    let subtotal = 0;
    const orderItemsData: NewOrderItem[] = [];

    for (const item of items) {
      if (!item.productIsActive) {
        throw new BusinessException(
          `Product ${item.productName} is unavailable`,
        );
      }
      if (item.productStock < item.quantity) {
        throw new BusinessException(`Insufficient stock for ${item.productName}`);
      }

      const unitPrice = Number(item.productPrice);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      const images = (item.productImage as string[]) ?? [];
      const variantLabel =
        item.variantName ||
        this.variantRepository.formatVariantName(item.variantOptions ?? {});

      orderItemsData.push({
        id: randomUUID(),
        orderId: '',
        productId: item.productId,
        variantId: item.variantId,
        variantName: variantLabel || null,
        sku: item.variantSku ?? null,
        productName: item.productName,
        productImage: images[0] ?? null,
        quantity: String(item.quantity),
        unitPrice: String(unitPrice),
        totalPrice: String(lineTotal),
      });
    }

    const shippingFee = dto.shippingFee ?? 0;
    const { discount, voucherCode, voucherId } =
      await this.voucherService.resolveDiscount(dto.voucherCode, subtotal);

    const total = subtotal - discount + shippingFee;
    if (total < 0) throw new BusinessException(MSG.INVALID_ORDER_TOTAL);

    const orderId = randomUUID();
    const orderNumber = `DH${Date.now().toString().slice(-9)}`;

    for (const oi of orderItemsData) {
      oi.orderId = orderId;
    }

    for (const item of items) {
      const updated = await this.variantRepository.decrementStock(
        item.variantId,
        item.quantity,
      );
      if (!updated) {
        throw new BusinessException(`Insufficient stock for ${item.productName}`);
      }
    }

    await this.orderRepository.createWithItems(
      {
        id: orderId,
        orderNumber,
        userId,
        status: 'pending',
        subtotal: String(subtotal),
        discount: String(discount),
        shippingFee: String(shippingFee),
        total: String(total),
        shippingAddress: dto.shippingAddress,
        note: dto.note,
        voucherCode: voucherCode ?? null,
        paymentMethod: 'cod',
        paymentStatus: 'unpaid',
      },
      orderItemsData,
    );

    if (voucherId) {
      await this.voucherService.applyUsage(voucherId);
    }

    await this.cartService.clearCartById(cart.id);

    const full = await this.orderRepository.findByIdWithItems(orderId);
    return successResponse(
      OrderMapper.toResponse(full!.order, full!.items, full!.statusHistory),
      MSG.ORDER_PLACED,
    );
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new BusinessException(MSG.ORDER_NOT_FOUND, 404);

    const statusNotes: Partial<Record<OrderStatus, string>> = {
      [OrderStatus.CONFIRMED]: 'Order confirmed',
      [OrderStatus.PROCESSING]: 'Order is being packed',
      [OrderStatus.SHIPPED]: 'Order handed to carrier',
      [OrderStatus.DELIVERED]: 'Delivered successfully',
    };

    await this.orderRepository.updateStatus(
      id,
      dto.status,
      statusNotes[dto.status],
    );

    if (dto.status === OrderStatus.DELIVERED) {
      await this.orderRepository.updatePaymentStatus(id, 'paid');
    }

    const full = await this.orderRepository.findByIdWithItems(id);
    return successResponse(
      OrderMapper.toResponse(full!.order, full!.items, full!.statusHistory),
      MSG.ORDER_STATUS_UPDATED,
    );
  }

  async cancel(id: string, userId: string, role: string, dto?: CancelOrderDto) {
    const result = await this.orderRepository.findByIdWithItems(id);
    if (!result) throw new BusinessException(MSG.ORDER_NOT_FOUND, 404);

    const isStaff = role === UserRole.ADMIN || role === UserRole.STAFF;
    if (!isStaff && result.order.userId !== userId) {
      throw new BusinessException(MSG.ORDER_NOT_FOUND, 404);
    }

    if (result.order.status === OrderStatus.CANCELLED) {
      throw new BusinessException(MSG.ORDER_CANCELLED);
    }
    const cancellable = [OrderStatus.PENDING, OrderStatus.CONFIRMED];
    if (!isStaff && !cancellable.includes(result.order.status as OrderStatus)) {
      throw new BusinessException(MSG.ORDER_CANNOT_CANCEL);
    }

    for (const item of result.items) {
      if (item.variantId) {
        await this.variantRepository.restoreStock(
          item.variantId,
          Number(item.quantity),
        );
      } else {
        await this.productRepository.restoreStock(
          item.productId,
          Number(item.quantity),
        );
      }
    }

    if (dto?.reason) {
      await this.orderRepository.setCancelReason(id, dto.reason);
    }

    await this.orderRepository.updateStatus(
      id,
      OrderStatus.CANCELLED,
      dto?.reason ?? 'Order cancelled',
    );

    const full = await this.orderRepository.findByIdWithItems(id);
    return successResponse(
      OrderMapper.toResponse(full!.order, full!.items, full!.statusHistory),
      MSG.ORDER_CANCELLED_SUCCESS,
    );
  }

  async reorder(id: string, userId: string, role: string) {
    const result = await this.orderRepository.findByIdWithItems(id);
    if (!result) throw new BusinessException(MSG.ORDER_NOT_FOUND, 404);

    const isStaff = role === UserRole.ADMIN || role === UserRole.STAFF;
    if (!isStaff && result.order.userId !== userId) {
      throw new BusinessException(MSG.ORDER_NOT_FOUND, 404);
    }

    const added: string[] = [];
    const skipped: {
      productId: string;
      productName: string;
      reason: string;
    }[] = [];

    for (const item of result.items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product || !product.isActive) {
        skipped.push({
          productId: item.productId,
          productName: item.productName,
          reason: MSG.PRODUCT_UNAVAILABLE,
        });
        continue;
      }

      let variantId: string | null = item.variantId ?? null;
      if (!variantId) {
        const def = await this.variantRepository.findDefaultByProductId(
          item.productId,
        );
        variantId = def?.id ?? null;
      }
      if (!variantId) {
        skipped.push({
          productId: item.productId,
          productName: item.productName,
          reason: MSG.PRODUCT_UNAVAILABLE,
        });
        continue;
      }

      const variant = await this.variantRepository.findById(variantId);
      const qty = Math.min(Number(item.quantity), variant?.stock ?? 0);
      if (qty < 1) {
        skipped.push({
          productId: item.productId,
          productName: item.productName,
          reason: MSG.INSUFFICIENT_STOCK,
        });
        continue;
      }
      try {
        await this.cartService.addItem(userId, {
          productId: item.productId,
          variantId,
          quantity: qty,
        });
        added.push(item.productName);
      } catch {
        skipped.push({
          productId: item.productId,
          productName: item.productName,
          reason: MSG.INSUFFICIENT_STOCK,
        });
      }
    }

    return successResponse(
      { added, skipped, addedCount: added.length },
      added.length
        ? `Added ${added.length} item(s) to cart`
        : 'No items were added to cart',
    );
  }
}
