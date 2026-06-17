import { randomUUID } from 'crypto';
import { eq, isNull } from 'drizzle-orm';
import { createDrizzleClient } from '../index';
import { products } from '../schema/products';
import { productVariants, productImages } from '../schema/product-variants';
import { cartItems } from '../schema/carts';
import { orderItems } from '../schema/orders';
import 'dotenv/config';

/**
 * Migrates legacy products (price/stock on product row) into default variants.
 * Run: npx tsx src/database/seeders/migrate-variants.ts
 */
async function migrate() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL required');

  const db = createDrizzleClient(url);
  const allProducts = await db.select().from(products);

  for (const product of allProducts) {
    const [existing] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, product.id))
      .limit(1);

    if (existing) continue;

    const variantId = randomUUID();
    const sku = product.sku ?? `SKU-${product.slug}`.slice(0, 100);

    await db.insert(productVariants).values({
      id: variantId,
      productId: product.id,
      sku,
      price: product.price,
      comparePrice: product.comparePrice ?? null,
      stock: product.stock,
      isActive: product.isActive,
    });

    const images = (product.images as string[]) ?? [];
    for (let i = 0; i < images.length; i++) {
      await db.insert(productImages).values({
        id: randomUUID(),
        productId: product.id,
        variantId: null,
        imageUrl: images[i],
        sortOrder: i,
      });
    }

    const cartRows = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.productId, product.id));

    for (const row of cartRows) {
      if (!row.variantId) {
        await db
          .update(cartItems)
          .set({ variantId })
          .where(eq(cartItems.id, row.id));
      }
    }

    const orderRows = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.productId, product.id));

    for (const row of orderRows) {
      if (!row.variantId) {
        await db
          .update(orderItems)
          .set({
            variantId,
            sku: sku,
            variantName: 'Mặc định',
          })
          .where(eq(orderItems.id, row.id));
      }
    }

    console.log(`✓ ${product.name} → variant ${sku}`);
  }

  const cartsWithoutVariant = await db
    .select()
    .from(cartItems)
    .where(isNull(cartItems.variantId));

  if (cartsWithoutVariant.length) {
    console.warn(
      `Còn ${cartsWithoutVariant.length} dòng giỏ hàng chưa có variant_id — xóa hoặc gán thủ công.`,
    );
  }

  console.log('Migration biến thể hoàn tất.');
  process.exit(0);
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
