import { Skeleton } from '@/components/ui/skeleton';

export function OrderListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-28" />
          </div>
          <Skeleton className="mt-4 h-16 w-full rounded-xl" />
          <Skeleton className="mt-4 h-10 w-36" />
        </div>
      ))}
    </div>
  );
}
