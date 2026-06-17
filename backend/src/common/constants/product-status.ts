export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  OUT_OF_STOCK = 'out_of_stock',
  ARCHIVED = 'archived',
}

export const PRODUCT_STATUS_VALUES = Object.values(ProductStatus);

export function isProductVisibleOnStorefront(status: ProductStatus): boolean {
  return status === ProductStatus.ACTIVE;
}

export function isActiveFromStatus(status: ProductStatus): boolean {
  return (
    status === ProductStatus.ACTIVE ||
    status === ProductStatus.OUT_OF_STOCK
  );
}

export function normalizeProductStatus(
  value?: string | null,
  isActive?: boolean,
): ProductStatus {
  if (value && PRODUCT_STATUS_VALUES.includes(value as ProductStatus)) {
    return value as ProductStatus;
  }
  return isActive === false ? ProductStatus.ARCHIVED : ProductStatus.ACTIVE;
}
