import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { createDrizzleClient } from '../index';
import { products } from '../schema/products';
import { VariantRepository } from '../../modules/products/repositories/variant.repository';

function normalizeToken(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .toUpperCase();
}

function inferOptionValuesFromSku(
  sku: string,
  options: { name: string; values: { value: string }[] }[],
): Record<string, string> {
  const skuUpper = normalizeToken(sku);
  const result: Record<string, string> = {};

  for (const opt of options) {
    let matched: string | undefined;
    for (const val of opt.values) {
      const token = normalizeToken(val.value).slice(0, 8);
      if (token && skuUpper.includes(token)) {
        matched = val.value;
        break;
      }
    }
    if (matched) result[opt.name] = matched;
  }

  return result;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL required');

  const db = createDrizzleClient(url);
  const variantRepository = new VariantRepository(db);
  const allProducts = await db.select({ id: products.id }).from(products);

  let repaired = 0;
  for (const { id } of allProducts) {
    const data = await variantRepository.loadProductVariantData(id);
    if (!data.variants.length || !data.options.length) continue;

    const variantIds = data.variants.map((v) => v.id);
    const optionsMap = await variantRepository.getVariantOptionsMap(variantIds);
    const needsRepair = data.variants.some(
      (v) => !Object.keys(optionsMap[v.id] ?? {}).length,
    );
    if (!needsRepair) continue;

    const optionInputs = data.options.map((o) => ({
      name: o.name,
      values: o.values.map((v) => v.value),
    }));

    const variants = data.variants.map((v) => {
      const existing = optionsMap[v.id] ?? {};
      const optionValues = Object.keys(existing).length
        ? existing
        : inferOptionValuesFromSku(v.sku, data.options);

      return {
        id: v.id,
        sku: v.sku,
        price: Number(v.price),
        comparePrice: v.comparePrice ? Number(v.comparePrice) : undefined,
        stock: v.stock,
        weight: v.weight ? Number(v.weight) : undefined,
        isActive: v.isActive,
        optionValues,
        imageUrl: v.imageUrl,
        imageUrls: v.imageUrls,
      };
    });

    const canRepair = variants.every(
      (v) => Object.keys(v.optionValues).length === data.options.length,
    );
    if (!canRepair) {
      console.log(`Skip ${id}: cannot infer all option values from SKU`);
      continue;
    }

    await variantRepository.saveProductVariants(
      id,
      optionInputs,
      variants,
      data.images,
    );
    repaired += 1;
    console.log(`Repaired product ${id}`);
  }

  for (const { id } of allProducts) {
    await variantRepository.syncProductThumbnail(id);
  }

  console.log(`Done. Repaired ${repaired} product(s), synced thumbnails for all.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
