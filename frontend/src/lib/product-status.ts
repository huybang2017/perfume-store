import { vi } from '@/lib/i18n';

export type ProductStatus = 'draft' | 'active' | 'out_of_stock' | 'archived';

export const PRODUCT_STATUSES: ProductStatus[] = [
  'draft',
  'active',
  'out_of_stock',
  'archived',
];

export function normalizeProductStatus(
  status?: string | null,
  isActive?: boolean,
): ProductStatus {
  if (status && PRODUCT_STATUSES.includes(status as ProductStatus)) {
    return status as ProductStatus;
  }
  return isActive === false ? 'archived' : 'active';
}

export function getProductStatusLabel(status: ProductStatus): string {
  const labels: Record<ProductStatus, string> = {
    draft: vi.admin.statusDraft,
    active: vi.admin.statusActive,
    out_of_stock: vi.admin.statusOutOfStock,
    archived: vi.admin.statusArchived,
  };
  return labels[status];
}

export function getProductStatusBadgeVariant(
  status: ProductStatus,
): 'default' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'active':
      return 'success';
    case 'draft':
      return 'warning';
    case 'out_of_stock':
      return 'danger';
    case 'archived':
    default:
      return 'default';
  }
}
