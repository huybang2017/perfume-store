import { Skeleton } from '@/components/ui/skeleton';
import {
  productGridClass,
  productGridWithSidebarClass,
} from '@/lib/product-grid';

type ProductGridLayout = 'full' | 'sidebar';

export function ProductGridSkeleton({
  count = 4,
  layout = 'full',
}: {
  count?: number;
  layout?: ProductGridLayout;
}) {
  const gridClass = layout === 'sidebar' ? productGridWithSidebarClass : productGridClass;

  return (
    <div className={gridClass}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-sm border-none bg-white">
          <Skeleton className="aspect-[4/5] w-full rounded-sm" />
          <div className="space-y-3 py-5 flex flex-col items-center">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
