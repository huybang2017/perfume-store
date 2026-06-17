import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatPriceRange, formatVND, vi } from '@/lib/i18n';
import { getProductThumbnail } from '@/lib/product-images';
import type { Product } from '@/types/api';
import { ROUTES } from '@/constants/routes';

interface ProductCardProps {
  product: Product;
  showStock?: boolean;
  showSale?: boolean;
}

export function ProductCard({
  product,
}: ProductCardProps) {
  const thumbnail = getProductThumbnail(product);
  const priceMin = product.priceMin ?? 0;
  const priceMax = product.priceMax ?? 0;

  const onSale =
    product.comparePrice != null &&
    product.comparePrice > priceMin;

  return (
    <Link href={ROUTES.product(product.slug)} className="group block h-full">
      <div className="flex flex-col h-full bg-white transition-all duration-300">
        <div className="relative aspect-[4/5] overflow-hidden bg-surface rounded-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnail}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {onSale && (
              <span className="bg-danger text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest shadow-sm">
                {vi.shop.sale}
              </span>
            )}
            {product.isFeatured && (
              <span className="bg-primary text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest shadow-sm">
                {vi.home.featuredBadge}
              </span>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-white/90 backdrop-blur-sm">
             <Button variant="default" className="w-full h-8 text-[10px] uppercase tracking-widest font-bold rounded-sm">
               Quick View
             </Button>
          </div>
        </div>
        <div className="flex flex-col flex-grow py-5 text-center px-2">
          <h3 className="line-clamp-2 text-sm font-serif font-bold text-secondary tracking-wide group-hover:text-primary transition-colors min-h-[2.5rem]">
            {product.name}
          </h3>
          <div className="mt-3 flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-primary tracking-widest">
              {product.hasVariants || priceMin !== priceMax
                ? formatPriceRange(priceMin, priceMax).toUpperCase()
                : formatVND(priceMin).toUpperCase()}
            </span>
            {product.comparePrice && (
              <span className="text-[10px] text-text-muted line-through tracking-widest">
                {formatVND(product.comparePrice).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
