export type ThumbnailSource = {
  thumbnailUrl?: string | null;
  images?: string[] | null;
};

export type VariantImageSource = {
  imageUrl?: string | null;
  imageUrls?: string[];
};

export function pickFirstImageUrl(
  sources: Array<string | null | undefined>,
): string | null {
  for (const source of sources) {
    const trimmed = source?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

export function resolveProductThumbnail(
  product: ThumbnailSource,
  variants?: VariantImageSource[],
): string | null {
  const explicit = product.thumbnailUrl?.trim();
  if (explicit) return explicit;

  const fromGallery = pickFirstImageUrl(product.images ?? []);
  if (fromGallery) return fromGallery;

  for (const variant of variants ?? []) {
    const variantImage = pickFirstImageUrl([
      variant.imageUrl,
      ...(variant.imageUrls ?? []),
    ]);
    if (variantImage) return variantImage;
  }

  return null;
}

export function pickFirstVariantImage(
  variants: Array<{ imageUrl?: string | null; imageUrls?: string[] }>,
): string | null {
  for (const variant of variants) {
    const image = pickFirstImageUrl([
      variant.imageUrl,
      ...(variant.imageUrls ?? []),
    ]);
    if (image) return image;
  }
  return null;
}
