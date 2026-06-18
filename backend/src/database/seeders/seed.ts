import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { createDrizzleClient } from '../index';
import { users } from '../schema/users';
import { categories } from '../schema/categories';
import { brands } from '../schema/brands';
import { products } from '../schema/products';
import { vouchers } from '../schema/vouchers';
import { settings } from '../schema/settings';
import 'dotenv/config';

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL required');

  const db = createDrizzleClient(url);
  const adminId = randomUUID();

  const hashed = await bcrypt.hash('Admin@123', 10);
  await db
    .insert(users)
    .values({
      id: adminId,
      email: 'admin@clothingstore.com',
      password: hashed,
      fullName: 'Quản trị viên',
      role: 'admin',
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { fullName: 'Quản trị viên' },
    });

  const categoryId = randomUUID();
  await db
    .insert(categories)
    .values({
      id: categoryId,
      name: 'Nam',
      slug: 'nam',
      description: 'Thời trang nam',
      sortOrder: 1,
    })
    .onConflictDoUpdate({ target: categories.slug, set: { name: 'Nam' } });

  const brandId = randomUUID();
  await db
    .insert(brands)
    .values({
      id: brandId,
      name: 'Classic Wear',
      slug: 'classic-wear',
    })
    .onConflictDoUpdate({ target: brands.slug, set: { name: 'Classic Wear' } });

  await db
    .insert(products)
    .values({
      id: randomUUID(),
      name: 'Áo thun cotton cổ điển',
      slug: 'ao-thun-cotton-co-dien',
      description: 'Áo thun cotton cao cấp cho mọi ngày',
      price: '299000',
      comparePrice: '399000',
      sku: 'TSH-001',
      images: ['https://placehold.co/600x800'],
      categoryId,
      brandId,
      stock: 100,
      isFeatured: true,
    })
    .onConflictDoUpdate({
      target: products.slug,
      set: {
        name: 'Áo thun cotton cổ điển',
        price: '299000',
        comparePrice: '399000',
        stock: 100,
        isFeatured: true,
      },
    });

  await db
    .insert(vouchers)
    .values({
      id: randomUUID(),
      code: 'SAVE10',
      description: 'Giảm 10% cho đơn từ 500.000 ₫',
      type: 'percentage',
      value: '10',
      minOrderAmount: '500000',
      maxDiscount: '100000',
      usageLimit: 100,
      usedCount: 0,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: vouchers.code,
      set: {
        description: 'Giảm 10% cho đơn từ 500.000 ₫',
        type: 'percentage',
        value: '10',
        minOrderAmount: '500000',
        maxDiscount: '100000',
        isActive: true,
      },
    });

  const defaultSettings = [
    { key: 'store_name', value: 'Clothify' },
    { key: 'support_email', value: 'hotro@clothingstore.com' },
  ];
  for (const s of defaultSettings) {
    await db
      .insert(settings)
      .values({ id: randomUUID(), ...s })
      .onConflictDoUpdate({ target: settings.key, set: { value: s.value } });
  }

  console.log('Seed hoàn tất.');
  console.log('Admin: admin@clothingstore.com / Admin@123');
  console.log('Mã giảm giá: SAVE10 (giảm 10%, đơn tối thiểu 500.000 ₫)');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
