import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MSG } from '../../../common/i18n/messages.en';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { successResponse } from '../../../common/utils/api-response.util';
import { ProductRepository } from '../../products/repositories/product.repository';
import { VariantRepository } from '../../products/repositories/variant.repository';
import { AddCartItemDto } from '../dto/add-cart-item.dto';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto';
import { CartMapper } from '../mappers/cart.mapper';
import { CartRepository } from '../repositories/cart.repository';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
    private readonly variantRepository: VariantRepository,
  ) {}

  async getCart(userId: string) {
    const cart = await this.cartRepository.findOrCreateByUserId(
      userId,
      randomUUID(),
    );
    await this.pruneOrphanedCartItems(cart.id);
    const items = await this.cartRepository.findItemsWithProducts(cart.id);
    const variantIds = items.map((i) => i.variantId);
    const optionsMap =
      await this.variantRepository.getVariantOptionsMap(variantIds);
    return successResponse(CartMapper.toResponse(cart, items, optionsMap));
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const product = await this.productRepository.findById(dto.productId);
    if (!product || !product.isActive) {
      throw new BusinessException(MSG.PRODUCT_UNAVAILABLE, 404);
    }

    const variant = await this.variantRepository.findById(dto.variantId);
    if (!variant || variant.productId !== dto.productId || !variant.isActive) {
      throw new BusinessException('Invalid variant', 404);
    }

    if (variant.stock < dto.quantity) {
      throw new BusinessException(MSG.INSUFFICIENT_STOCK);
    }

    const cart = await this.cartRepository.findOrCreateByUserId(
      userId,
      randomUUID(),
    );
    const existing = await this.cartRepository.findItemByCartAndVariant(
      cart.id,
      dto.variantId,
    );

    if (existing) {
      const newQty = existing.quantity + dto.quantity;
      if (variant.stock < newQty) {
        throw new BusinessException(MSG.INSUFFICIENT_STOCK);
      }
      await this.cartRepository.updateItemQuantity(existing.id, newQty);
    } else {
      await this.cartRepository.addItem({
        id: randomUUID(),
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId,
        quantity: dto.quantity,
      });
    }

    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) throw new BusinessException(MSG.CART_NOT_FOUND, 404);

    const item = await this.cartRepository.findItemById(itemId);
    if (!item || item.cartId !== cart.id) {
      throw new BusinessException(MSG.CART_ITEM_NOT_FOUND, 404);
    }

    const variant = await this.variantRepository.findById(item.variantId);
    if (!variant || variant.stock < dto.quantity) {
      throw new BusinessException(MSG.INSUFFICIENT_STOCK);
    }

    await this.cartRepository.updateItemQuantity(itemId, dto.quantity);
    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) throw new BusinessException(MSG.CART_NOT_FOUND, 404);

    const item = await this.cartRepository.findItemById(itemId);
    if (!item || item.cartId !== cart.id) {
      throw new BusinessException(MSG.CART_ITEM_NOT_FOUND, 404);
    }

    await this.cartRepository.removeItem(itemId);
    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      return successResponse({
        id: '',
        userId,
        items: [],
        itemCount: 0,
        subtotal: 0,
      });
    }
    await this.cartRepository.clearCart(cart.id);
    return this.getCart(userId);
  }

  private async pruneOrphanedCartItems(cartId: string) {
    const allItems = await this.cartRepository.findItemsByCartId(cartId);
    const validItems =
      await this.cartRepository.findItemsWithProducts(cartId);
    const validIds = new Set(validItems.map((i) => i.id));
    for (const item of allItems) {
      if (!validIds.has(item.id)) {
        await this.cartRepository.removeItem(item.id);
      }
    }
  }

  async getCartItemsForCheckout(userId: string) {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) throw new BusinessException(MSG.CART_EMPTY);
    await this.pruneOrphanedCartItems(cart.id);
    const items = await this.cartRepository.findItemsWithProducts(cart.id);
    if (!items.length) throw new BusinessException(MSG.CART_EMPTY);

    const variantIds = items.map((i) => i.variantId);
    const optionsMap =
      await this.variantRepository.getVariantOptionsMap(variantIds);

    return {
      cart,
      items: items.map((item) => ({
        ...item,
        variantOptions: optionsMap[item.variantId] ?? {},
        variantName: this.variantRepository.formatVariantName(
          optionsMap[item.variantId] ?? {},
        ),
        productPrice: item.variantPrice,
        productStock: item.variantStock,
        productIsActive: item.productIsActive && item.variantIsActive,
      })),
    };
  }

  async clearCartById(cartId: string) {
    await this.cartRepository.clearCart(cartId);
  }
}
