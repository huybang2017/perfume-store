import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import {
  carts,
  cartItems,
  Cart,
  NewCart,
  NewCartItem,
  CartItem,
} from '../../../database/schema/carts';
import { products } from '../../../database/schema/products';
import { productVariants } from '../../../database/schema/product-variants';

@Injectable()
export class CartRepository extends BaseRepository {
  async findByUserId(userId: string): Promise<Cart | undefined> {
    const [cart] = await this.db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1);
    return cart;
  }

  async create(data: NewCart): Promise<Cart> {
    await this.db.insert(carts).values(data);
    return (await this.findByUserId(data.userId))!;
  }

  async findOrCreateByUserId(userId: string, cartId: string): Promise<Cart> {
    const existing = await this.findByUserId(userId);
    if (existing) return existing;
    return this.create({ id: cartId, userId });
  }

  async findItemByCartAndVariant(
    cartId: string,
    variantId: string,
  ): Promise<CartItem | undefined> {
    const [item] = await this.db
      .select()
      .from(cartItems)
      .where(
        and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, variantId)),
      )
      .limit(1);
    return item;
  }

  async findItemsByCartId(cartId: string): Promise<CartItem[]> {
    return this.db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
  }

  async findItemsWithProducts(cartId: string) {
    return this.db
      .select({
        id: cartItems.id,
        cartId: cartItems.cartId,
        productId: cartItems.productId,
        variantId: cartItems.variantId,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        productName: products.name,
        productSlug: products.slug,
        productIsActive: products.isActive,
        variantSku: productVariants.sku,
        variantPrice: productVariants.price,
        variantStock: productVariants.stock,
        variantIsActive: productVariants.isActive,
        productImage: products.images,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
      .where(eq(cartItems.cartId, cartId));
  }

  async addItem(data: NewCartItem): Promise<CartItem> {
    await this.db.insert(cartItems).values(data);
    const [item] = await this.db
      .select()
      .from(cartItems)
      .where(eq(cartItems.id, data.id))
      .limit(1);
    return item;
  }

  async updateItemQuantity(
    itemId: string,
    quantity: number,
  ): Promise<CartItem | undefined> {
    await this.db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, itemId));
    const [item] = await this.db
      .select()
      .from(cartItems)
      .where(eq(cartItems.id, itemId))
      .limit(1);
    return item;
  }

  async removeItem(itemId: string): Promise<void> {
    await this.db.delete(cartItems).where(eq(cartItems.id, itemId));
  }

  async clearCart(cartId: string): Promise<void> {
    await this.db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  }

  async findItemById(itemId: string): Promise<CartItem | undefined> {
    const [item] = await this.db
      .select()
      .from(cartItems)
      .where(eq(cartItems.id, itemId))
      .limit(1);
    return item;
  }
}
