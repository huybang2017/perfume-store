import { randomUUID } from 'crypto';
import { eq, inArray } from 'drizzle-orm';
import { createDrizzleClient } from '../index';
import { products } from '../schema/products';
import {
  productVariants,
  productOptions,
  productOptionValues,
  variantOptionValues,
  productImages,
} from '../schema/product-variants';
import 'dotenv/config';

const DEMO_SLUG = 'classic-cotton-tshirt';

const COLORS = ['Đen', 'Trắng', 'Xanh'];
const SIZES = ['S', 'M', 'L', 'XL'];

/** Stock matrix: color × size — 0 = hết hàng */
const STOCK: Record<string, Record<string, number>> = {
  Đen: { S: 10, M: 15, L: 30, XL: 0 },
  Trắng: { S: 5, M: 8, L: 12, XL: 6 },
  Xanh: { S: 8, M: 10, L: 20, XL: 4 },
};

const BASE_PRICE: Record<string, number> = {
  Đen: 250000,
  Trắng: 280000,
  Xanh: 320000,
};

async function saveVariants(
  db: ReturnType<typeof createDrizzleClient>,
  productId: string,
) {
  const existing = await db
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(eq(productVariants.productId, productId));
  const existingIds = existing.map((v) => v.id);

  await db.transaction(async (tx) => {
    if (existingIds.length) {
      await tx
        .delete(variantOptionValues)
        .where(inArray(variantOptionValues.variantId, existingIds));
      await tx
        .delete(productVariants)
        .where(eq(productVariants.productId, productId));
    }

    const oldOptions = await tx
      .select({ id: productOptions.id })
      .from(productOptions)
      .where(eq(productOptions.productId, productId));

    for (const o of oldOptions) {
      await tx
        .delete(productOptionValues)
        .where(eq(productOptionValues.optionId, o.id));
    }
    await tx
      .delete(productOptions)
      .where(eq(productOptions.productId, productId));
    await tx
      .delete(productImages)
      .where(eq(productImages.productId, productId));

    const optionValueMap = new Map<string, string>();

    const colorOptId = randomUUID();
    await tx.insert(productOptions).values({
      id: colorOptId,
      productId,
      name: 'Màu sắc',
      sortOrder: 0,
    });
    for (let i = 0; i < COLORS.length; i++) {
      const valId = randomUUID();
      await tx.insert(productOptionValues).values({
        id: valId,
        optionId: colorOptId,
        value: COLORS[i],
        sortOrder: i,
      });
      optionValueMap.set(`Màu sắc::${COLORS[i]}`, valId);
    }

    const sizeOptId = randomUUID();
    await tx.insert(productOptions).values({
      id: sizeOptId,
      productId,
      name: 'Size',
      sortOrder: 1,
    });
    for (let i = 0; i < SIZES.length; i++) {
      const valId = randomUUID();
      await tx.insert(productOptionValues).values({
        id: valId,
        optionId: sizeOptId,
        value: SIZES[i],
        sortOrder: i,
      });
      optionValueMap.set(`Size::${SIZES[i]}`, valId);
    }

    for (const color of COLORS) {
      for (const size of SIZES) {
        const stock = STOCK[color][size];
        const variantId = randomUUID();
        const sku = `TSH-001-${color === 'Đen' ? 'BLACK' : color === 'Trắng' ? 'WHITE' : 'BLUE'}-${size}`;
        const price = BASE_PRICE[color] + (SIZES.indexOf(size) * 5000);

        await tx.insert(productVariants).values({
          id: variantId,
          productId,
          sku,
          price: String(price),
          comparePrice: String(price + 50000),
          stock,
          isActive: true,
        });

        for (const [optName, optVal] of [
          ['Màu sắc', color],
          ['Size', size],
        ] as const) {
          const optionValueId = optionValueMap.get(`${optName}::${optVal}`);
          if (optionValueId) {
            await tx.insert(variantOptionValues).values({
              id: randomUUID(),
              variantId,
              optionValueId,
            });
          }
        }
      }
    }
  });

  const allVariants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, productId));

  const priceMin = Math.min(...allVariants.map((v) => Number(v.price)));
  const priceMax = Math.max(...allVariants.map((v) => Number(v.price)));
  const totalStock = allVariants.reduce((s, v) => s + v.stock, 0);
  const first = allVariants[0];

  await db
    .update(products)
    .set({
      name: 'Áo thun cotton cổ điển',
      price: String(first?.price ?? priceMin),
      comparePrice: first?.comparePrice ?? null,
      stock: totalStock,
    })
    .where(eq(products.id, productId));

  console.log(
    `✓ Đã tạo ${allVariants.length} biến thể (giá ${priceMin}–${priceMax} ₫, tồn ${totalStock})`,
  );
}

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL required');

  const db = createDrizzleClient(url);
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.slug, DEMO_SLUG))
    .limit(1);

  if (!product) {
    console.error(
      `Không tìm thấy sản phẩm slug="${DEMO_SLUG}". Tạo sản phẩm trước hoặc đổi slug trong admin.`,
    );
    process.exit(1);
  }

  await saveVariants(db, product.id);
  console.log(`Demo biến thể cho: ${product.name} (${DEMO_SLUG})`);
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
