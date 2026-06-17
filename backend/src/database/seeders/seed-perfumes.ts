import { randomUUID } from 'crypto';
import { eq, inArray } from 'drizzle-orm';
import { createDrizzleClient } from '../index';
import { categories } from '../schema/categories';
import { brands } from '../schema/brands';
import { products } from '../schema/products';
import {
  productVariants,
  productOptions,
  productOptionValues,
  variantOptionValues,
} from '../schema/product-variants';
import 'dotenv/config';

/**
 * Seeds 60 perfume products (20 Nam / 20 Nữ / 20 Unisex), each with two
 * variants: a 5ml chiết (decant) and a full-size chính hãng bottle.
 * Run: npx tsx src/database/seeders/seed-perfumes.ts
 */

type Gender = 'nam' | 'nu' | 'unisex';

interface PerfumeSeed {
  name: string;
  brand: string;
  gender: Gender;
  decantPrice: number;
  decantMl: number;
  decantStock: number;
  fullPrice: number;
  fullMl: number;
  fullStock: number;
  featured?: boolean;
}

const PERFUMES: PerfumeSeed[] = [
  // ── NAM (20) ──────────────────────────────────────────────
  { name: 'Khadlaj Snow', brand: 'Khadlaj', gender: 'nam', decantPrice: 90000, decantMl: 5, decantStock: 60, fullPrice: 550000, fullMl: 100, fullStock: 15 },
  { name: 'FA Spicy Amber', brand: 'Fragrance World', gender: 'nam', decantPrice: 85000, decantMl: 5, decantStock: 60, fullPrice: 500000, fullMl: 80, fullStock: 15 },
  { name: 'YSL Y', brand: 'YSL', gender: 'nam', decantPrice: 190000, decantMl: 5, decantStock: 40, fullPrice: 2950000, fullMl: 100, fullStock: 8, featured: true },
  { name: 'Armaf Suits', brand: 'Armaf', gender: 'nam', decantPrice: 95000, decantMl: 5, decantStock: 60, fullPrice: 600000, fullMl: 100, fullStock: 15 },
  { name: 'Armaf Ody Aqua', brand: 'Armaf', gender: 'nam', decantPrice: 90000, decantMl: 5, decantStock: 60, fullPrice: 580000, fullMl: 100, fullStock: 15 },
  { name: 'Ralph Lauren Polo Blue', brand: 'Ralph Lauren', gender: 'nam', decantPrice: 160000, decantMl: 5, decantStock: 40, fullPrice: 2300000, fullMl: 125, fullStock: 8 },
  { name: 'Versace Pour Homme', brand: 'Versace', gender: 'nam', decantPrice: 150000, decantMl: 5, decantStock: 40, fullPrice: 2150000, fullMl: 100, fullStock: 8 },
  { name: 'Mont Blanc Explorer', brand: 'Mont Blanc', gender: 'nam', decantPrice: 150000, decantMl: 5, decantStock: 40, fullPrice: 2250000, fullMl: 100, fullStock: 8 },
  { name: 'Dior Sauvage EDP', brand: 'Dior', gender: 'nam', decantPrice: 180000, decantMl: 5, decantStock: 50, fullPrice: 3200000, fullMl: 100, fullStock: 8 },
  { name: 'Chanel Bleu de Chanel EDP', brand: 'Chanel', gender: 'nam', decantPrice: 200000, decantMl: 5, decantStock: 40, fullPrice: 3400000, fullMl: 100, fullStock: 6 },
  { name: 'Giorgio Armani Code', brand: 'Giorgio Armani', gender: 'nam', decantPrice: 170000, decantMl: 5, decantStock: 40, fullPrice: 2650000, fullMl: 100, fullStock: 8 },
  { name: 'Dior Homme Intense', brand: 'Dior', gender: 'nam', decantPrice: 210000, decantMl: 5, decantStock: 35, fullPrice: 3300000, fullMl: 100, fullStock: 6 },
  { name: 'Tom Ford Noir Extreme', brand: 'Tom Ford', gender: 'nam', decantPrice: 280000, decantMl: 5, decantStock: 25, fullPrice: 4800000, fullMl: 100, fullStock: 4 },
  { name: 'Prada Luna Rossa Carbon', brand: 'Prada', gender: 'nam', decantPrice: 170000, decantMl: 5, decantStock: 35, fullPrice: 2500000, fullMl: 100, fullStock: 8 },
  { name: 'Giorgio Armani Acqua di Giò', brand: 'Giorgio Armani', gender: 'nam', decantPrice: 150000, decantMl: 5, decantStock: 40, fullPrice: 2200000, fullMl: 100, fullStock: 8 },
  { name: "YSL La Nuit de L'Homme", brand: 'YSL', gender: 'nam', decantPrice: 160000, decantMl: 5, decantStock: 35, fullPrice: 2150000, fullMl: 100, fullStock: 8 },
  { name: 'Burberry Hero', brand: 'Burberry', gender: 'nam', decantPrice: 150000, decantMl: 5, decantStock: 35, fullPrice: 2150000, fullMl: 100, fullStock: 8 },
  { name: 'Hugo Boss Bottled', brand: 'Hugo Boss', gender: 'nam', decantPrice: 140000, decantMl: 5, decantStock: 40, fullPrice: 1950000, fullMl: 100, fullStock: 10 },
  { name: 'Jean Paul Gaultier Le Male', brand: 'Jean Paul Gaultier', gender: 'nam', decantPrice: 150000, decantMl: 5, decantStock: 35, fullPrice: 2300000, fullMl: 125, fullStock: 8 },
  { name: 'Creed Aventus', brand: 'Creed', gender: 'nam', decantPrice: 350000, decantMl: 5, decantStock: 20, fullPrice: 6800000, fullMl: 100, fullStock: 3 },

  // ── NỮ (20) ───────────────────────────────────────────────
  { name: 'Marwa', brand: 'Lattafa', gender: 'nu', decantPrice: 80000, decantMl: 5, decantStock: 60, fullPrice: 520000, fullMl: 100, fullStock: 15 },
  { name: 'Narciso Rodriguez Musc Noir Rose', brand: 'Narciso Rodriguez', gender: 'nu', decantPrice: 190000, decantMl: 5, decantStock: 35, fullPrice: 2750000, fullMl: 90, fullStock: 8 },
  { name: 'Calvin Klein Euphoria', brand: 'Calvin Klein', gender: 'nu', decantPrice: 140000, decantMl: 5, decantStock: 40, fullPrice: 1850000, fullMl: 100, fullStock: 10 },
  { name: 'Moschino Toy Girl', brand: 'Moschino', gender: 'nu', decantPrice: 150000, decantMl: 5, decantStock: 35, fullPrice: 2150000, fullMl: 100, fullStock: 8 },
  { name: 'Delilah Blanc', brand: 'Khadlaj', gender: 'nu', decantPrice: 85000, decantMl: 5, decantStock: 60, fullPrice: 520000, fullMl: 100, fullStock: 15 },
  { name: "Dolce & Gabbana L'Imperatrice", brand: 'Dolce & Gabbana', gender: 'nu', decantPrice: 150000, decantMl: 5, decantStock: 35, fullPrice: 1950000, fullMl: 100, fullStock: 8 },
  { name: 'Mugler Alien Goddess', brand: 'Mugler', gender: 'nu', decantPrice: 180000, decantMl: 5, decantStock: 35, fullPrice: 2850000, fullMl: 90, fullStock: 8 },
  { name: 'Chloé Nomade', brand: 'Chloé', gender: 'nu', decantPrice: 180000, decantMl: 5, decantStock: 35, fullPrice: 2700000, fullMl: 75, fullStock: 8 },
  { name: 'Paco Rabanne 1 Million Lady', brand: 'Paco Rabanne', gender: 'nu', decantPrice: 150000, decantMl: 5, decantStock: 35, fullPrice: 2050000, fullMl: 80, fullStock: 8 },
  { name: 'Chanel Coco Mademoiselle', brand: 'Chanel', gender: 'nu', decantPrice: 210000, decantMl: 5, decantStock: 35, fullPrice: 3100000, fullMl: 50, fullStock: 6 },
  { name: 'Dior Miss Dior Blooming Bouquet', brand: 'Dior', gender: 'nu', decantPrice: 170000, decantMl: 5, decantStock: 35, fullPrice: 2750000, fullMl: 100, fullStock: 8 },
  { name: 'YSL Black Opium', brand: 'YSL', gender: 'nu', decantPrice: 190000, decantMl: 5, decantStock: 35, fullPrice: 2900000, fullMl: 90, fullStock: 8 },
  { name: 'Lancôme La Vie Est Belle', brand: 'Lancôme', gender: 'nu', decantPrice: 160000, decantMl: 5, decantStock: 35, fullPrice: 2350000, fullMl: 100, fullStock: 8 },
  { name: 'Gucci Bloom', brand: 'Gucci', gender: 'nu', decantPrice: 180000, decantMl: 5, decantStock: 35, fullPrice: 2650000, fullMl: 100, fullStock: 8 },
  { name: 'Viktor & Rolf Flowerbomb', brand: 'Viktor & Rolf', gender: 'nu', decantPrice: 200000, decantMl: 5, decantStock: 30, fullPrice: 3050000, fullMl: 100, fullStock: 6 },
  { name: 'Carolina Herrera Good Girl', brand: 'Carolina Herrera', gender: 'nu', decantPrice: 190000, decantMl: 5, decantStock: 30, fullPrice: 2950000, fullMl: 80, fullStock: 6 },
  { name: 'Marc Jacobs Daisy', brand: 'Marc Jacobs', gender: 'nu', decantPrice: 150000, decantMl: 5, decantStock: 35, fullPrice: 2050000, fullMl: 100, fullStock: 8 },
  { name: 'Burberry Her', brand: 'Burberry', gender: 'nu', decantPrice: 160000, decantMl: 5, decantStock: 35, fullPrice: 2250000, fullMl: 100, fullStock: 8 },
  { name: 'Versace Bright Crystal', brand: 'Versace', gender: 'nu', decantPrice: 140000, decantMl: 5, decantStock: 40, fullPrice: 1950000, fullMl: 90, fullStock: 10 },
  { name: 'Giorgio Armani Sì', brand: 'Giorgio Armani', gender: 'nu', decantPrice: 190000, decantMl: 5, decantStock: 30, fullPrice: 2900000, fullMl: 100, fullStock: 6 },

  // ── UNISEX (20) ───────────────────────────────────────────
  { name: 'Maison Asrar Majesty', brand: 'Maison Asrar', gender: 'unisex', decantPrice: 120000, decantMl: 5, decantStock: 45, fullPrice: 750000, fullMl: 100, fullStock: 12 },
  { name: 'Maison Asrar Vanguard', brand: 'Maison Asrar', gender: 'unisex', decantPrice: 120000, decantMl: 5, decantStock: 45, fullPrice: 750000, fullMl: 100, fullStock: 12 },
  { name: 'Black Paw Bu Zhi Chun', brand: 'Black Paw', gender: 'unisex', decantPrice: 110000, decantMl: 5, decantStock: 45, fullPrice: 650000, fullMl: 100, fullStock: 12 },
  { name: 'Alex Blue Oceanic', brand: 'Alex', gender: 'unisex', decantPrice: 85000, decantMl: 5, decantStock: 50, fullPrice: 520000, fullMl: 100, fullStock: 15 },
  { name: 'Ventana EDP', brand: 'Lattafa', gender: 'unisex', decantPrice: 90000, decantMl: 5, decantStock: 50, fullPrice: 560000, fullMl: 100, fullStock: 15 },
  { name: 'Mandarin Sky', brand: 'Lattafa', gender: 'unisex', decantPrice: 85000, decantMl: 5, decantStock: 50, fullPrice: 530000, fullMl: 100, fullStock: 15 },
  { name: 'SL Cedra', brand: 'Lattafa', gender: 'unisex', decantPrice: 90000, decantMl: 5, decantStock: 50, fullPrice: 550000, fullMl: 100, fullStock: 15 },
  { name: 'Clean Reserve Suede Oud', brand: 'Clean', gender: 'unisex', decantPrice: 220000, decantMl: 5, decantStock: 30, fullPrice: 3200000, fullMl: 100, fullStock: 6 },
  { name: 'Replica Autumn Vibes', brand: 'Maison Margiela', gender: 'unisex', decantPrice: 230000, decantMl: 5, decantStock: 30, fullPrice: 3300000, fullMl: 100, fullStock: 6 },
  { name: 'Mancera Cedrat Boise', brand: 'Mancera', gender: 'unisex', decantPrice: 260000, decantMl: 5, decantStock: 25, fullPrice: 4200000, fullMl: 120, fullStock: 5 },
  { name: 'Maison Francis Kurkdjian Baccarat Rouge 540', brand: 'Maison Francis Kurkdjian', gender: 'unisex', decantPrice: 420000, decantMl: 5, decantStock: 15, fullPrice: 7800000, fullMl: 70, fullStock: 3 },
  { name: 'Le Labo Santal 33', brand: 'Le Labo', gender: 'unisex', decantPrice: 350000, decantMl: 5, decantStock: 20, fullPrice: 5200000, fullMl: 50, fullStock: 4 },
  { name: 'Tom Ford Oud Wood', brand: 'Tom Ford', gender: 'unisex', decantPrice: 320000, decantMl: 5, decantStock: 20, fullPrice: 5800000, fullMl: 50, fullStock: 4 },
  { name: 'Jo Malone Wood Sage & Sea Salt', brand: 'Jo Malone', gender: 'unisex', decantPrice: 230000, decantMl: 5, decantStock: 25, fullPrice: 3400000, fullMl: 100, fullStock: 6 },
  { name: 'Byredo Gypsy Water', brand: 'Byredo', gender: 'unisex', decantPrice: 290000, decantMl: 5, decantStock: 20, fullPrice: 4900000, fullMl: 100, fullStock: 4 },
  { name: 'Initio Side Effect', brand: 'Initio', gender: 'unisex', decantPrice: 340000, decantMl: 5, decantStock: 15, fullPrice: 6200000, fullMl: 90, fullStock: 3 },
  { name: 'Kilian Black Phantom', brand: 'Kilian', gender: 'unisex', decantPrice: 330000, decantMl: 5, decantStock: 15, fullPrice: 6900000, fullMl: 50, fullStock: 3 },
  { name: 'Amouage Interlude', brand: 'Amouage', gender: 'unisex', decantPrice: 350000, decantMl: 5, decantStock: 15, fullPrice: 7200000, fullMl: 100, fullStock: 3 },
  { name: 'Xerjoff Naxos', brand: 'Xerjoff', gender: 'unisex', decantPrice: 360000, decantMl: 5, decantStock: 15, fullPrice: 7500000, fullMl: 100, fullStock: 3 },
  { name: 'Parfums de Marly Layton', brand: 'Parfums de Marly', gender: 'unisex', decantPrice: 300000, decantMl: 5, decantStock: 20, fullPrice: 5600000, fullMl: 125, fullStock: 4 },
];

const CATEGORY_DEFS: Record<Gender, { name: string; slug: string; description: string }> = {
  nam: { name: 'Nam', slug: 'nam', description: 'Nước hoa dành cho Nam' },
  nu: { name: 'Nữ', slug: 'nu', description: 'Nước hoa dành cho Nữ' },
  unisex: { name: 'Unisex', slug: 'unisex', description: 'Nước hoa Unisex' },
};

function slugify(input: string): string {
  return input
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL required');

  const db = createDrizzleClient(url);

  const categoryIds = {} as Record<Gender, string>;
  for (const gender of Object.keys(CATEGORY_DEFS) as Gender[]) {
    const def = CATEGORY_DEFS[gender];
    await db
      .insert(categories)
      .values({ id: randomUUID(), ...def })
      .onDuplicateKeyUpdate({ set: { name: def.name, description: def.description } });
    const [row] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, def.slug))
      .limit(1);
    categoryIds[gender] = row!.id;
  }

  const brandIds = new Map<string, string>();
  async function ensureBrand(name: string): Promise<string> {
    const slug = slugify(name);
    const cached = brandIds.get(slug);
    if (cached) return cached;

    await db
      .insert(brands)
      .values({ id: randomUUID(), name, slug })
      .onDuplicateKeyUpdate({ set: { name } });
    const [row] = await db
      .select({ id: brands.id })
      .from(brands)
      .where(eq(brands.slug, slug))
      .limit(1);
    brandIds.set(slug, row!.id);
    return row!.id;
  }

  let created = 0;
  for (const item of PERFUMES) {
    const slug = slugify(item.name);
    const brandId = await ensureBrand(item.brand);
    const categoryId = categoryIds[item.gender];
    const thumbnailUrl = `https://placehold.co/600x800?text=${encodeURIComponent(item.name)}`;

    await db
      .insert(products)
      .values({
        id: randomUUID(),
        name: item.name,
        slug,
        description: `${item.name} – chính hãng, có bản chiết ${item.decantMl}ml và full size ${item.fullMl}ml.`,
        price: String(item.decantPrice),
        comparePrice: null,
        images: [thumbnailUrl],
        thumbnailUrl,
        categoryId,
        brandId,
        stock: item.decantStock + item.fullStock,
        isFeatured: !!item.featured,
        isActive: true,
        status: 'active',
      })
      .onDuplicateKeyUpdate({
        set: {
          name: item.name,
          price: String(item.decantPrice),
          categoryId,
          brandId,
          stock: item.decantStock + item.fullStock,
          isFeatured: !!item.featured,
          isActive: true,
          status: 'active',
        },
      });

    const [productRow] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);
    const productId = productRow!.id;

    const existingVariants = await db
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(eq(productVariants.productId, productId));
    const existingVariantIds = existingVariants.map((v) => v.id);
    if (existingVariantIds.length) {
      await db
        .delete(variantOptionValues)
        .where(inArray(variantOptionValues.variantId, existingVariantIds));
      await db.delete(productVariants).where(eq(productVariants.productId, productId));
    }

    const existingOptions = await db
      .select({ id: productOptions.id })
      .from(productOptions)
      .where(eq(productOptions.productId, productId));
    for (const option of existingOptions) {
      await db.delete(productOptionValues).where(eq(productOptionValues.optionId, option.id));
    }
    await db.delete(productOptions).where(eq(productOptions.productId, productId));

    const optionId = randomUUID();
    await db.insert(productOptions).values({
      id: optionId,
      productId,
      name: 'Dung tích',
      sortOrder: 0,
    });

    const decantValueId = randomUUID();
    const fullValueId = randomUUID();
    await db.insert(productOptionValues).values([
      { id: decantValueId, optionId, value: `${item.decantMl}ml (Chiết)`, sortOrder: 0 },
      { id: fullValueId, optionId, value: `Full ${item.fullMl}ml (Chính hãng)`, sortOrder: 1 },
    ]);

    const decantVariantId = randomUUID();
    const fullVariantId = randomUUID();
    await db.insert(productVariants).values([
      {
        id: decantVariantId,
        productId,
        sku: `${slug}-${item.decantMl}ml`.toUpperCase().slice(0, 100),
        price: String(item.decantPrice),
        comparePrice: null,
        stock: item.decantStock,
        isActive: true,
        imageUrl: thumbnailUrl,
      },
      {
        id: fullVariantId,
        productId,
        sku: `${slug}-full-${item.fullMl}ml`.toUpperCase().slice(0, 100),
        price: String(item.fullPrice),
        comparePrice: null,
        stock: item.fullStock,
        isActive: true,
        imageUrl: thumbnailUrl,
      },
    ]);

    await db.insert(variantOptionValues).values([
      { id: randomUUID(), variantId: decantVariantId, optionValueId: decantValueId },
      { id: randomUUID(), variantId: fullVariantId, optionValueId: fullValueId },
    ]);

    created++;
    console.log(
      `✓ [${item.gender}] ${item.name} — chiết ${item.decantPrice.toLocaleString('vi-VN')}đ / full ${item.fullPrice.toLocaleString('vi-VN')}đ`,
    );
  }

  console.log(`\nĐã seed ${created} sản phẩm nước hoa (20 Nam / 20 Nữ / 20 Unisex).`);
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
