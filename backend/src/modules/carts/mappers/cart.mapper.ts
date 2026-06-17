type CartItemRow = {
  id: string;
  cartId: string;
  productId: string;
  variantId: string;
  quantity: number;
  createdAt: Date;
  productName: string;
  productSlug: string;
  productIsActive: boolean;
  variantSku: string;
  variantPrice: string;
  variantStock: number;
  variantIsActive: boolean;
  productImage: unknown;
};

function pickProductImage(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('http')) return trimmed;
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed) && typeof parsed[0] === 'string') return parsed[0];
      if (typeof parsed === 'string') return parsed;
    } catch {
      return null;
    }
    return null;
  }
  if (Array.isArray(raw) && typeof raw[0] === 'string') return raw[0];
  return null;
}

export class CartMapper {
  static toResponse(
    cart: { id: string; userId: string },
    items: CartItemRow[],
    optionsMap: Record<string, Record<string, string>> = {},
  ) {
    const mappedItems = items.map((item) => {
      const unitPrice = Number(item.variantPrice);
      const options = optionsMap[item.variantId] ?? {};
      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
        variantOptions: options,
        sku: item.variantSku,
        product: {
          name: item.productName,
          slug: item.productSlug,
          image: pickProductImage(item.productImage),
          stock: item.variantStock,
          isActive: item.productIsActive && item.variantIsActive,
        },
      };
    });

    const subtotal = mappedItems.reduce((sum, i) => sum + i.lineTotal, 0);

    return {
      id: cart.id,
      userId: cart.userId,
      items: mappedItems,
      itemCount: mappedItems.reduce((sum, i) => sum + i.quantity, 0),
      subtotal,
    };
  }
}
