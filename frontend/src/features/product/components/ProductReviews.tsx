'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import {
  useGetProductReviewsQuery,
  useCreateReviewMutation,
} from '@/store/api/reviewApi';
import { ROUTES } from '@/constants/routes';
import { vi } from '@/lib/i18n';
import { cn } from '@/lib/utils';

function Stars({ rating, interactive, onSelect }: {
  rating: number;
  interactive?: boolean;
  onSelect?: (n: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onSelect?.(n)}
          className={cn(
            interactive && 'cursor-pointer hover:scale-110',
            !interactive && 'cursor-default',
          )}
        >
          <Star
            className={cn(
              'h-5 w-5',
              n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300',
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const { data, isLoading } = useGetProductReviewsQuery({
    productId,
    page: 1,
    limit: 20,
  });
  const [createReview, { isLoading: submitting }] = useCreateReviewMutation();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showForm, setShowForm] = useState(false);

  const reviews = data?.data ?? [];

  const handleSubmit = async () => {
    await createReview({ productId, rating, comment: comment || undefined });
    setComment('');
    setShowForm(false);
  };

  return (
    <section className="mt-16 border-t border-slate-200 pt-12">
      <h2 className="text-xl font-semibold text-slate-900">{vi.product.reviews}</h2>

      {user ? (
        <div className="mt-4">
          {!showForm ? (
            <Button variant="outline" onClick={() => setShowForm(true)}>
              {vi.product.writeReview}
            </Button>
          ) : (
            <Card className="mt-4 max-w-lg">
              <CardContent className="space-y-4 p-5">
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">
                    {vi.product.yourRating}
                  </p>
                  <Stars rating={rating} interactive onSelect={setRating} />
                </div>
                <textarea
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder={vi.product.reviewComment}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {vi.product.submitReview}
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    {vi.common.cancel}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          {vi.product.loginToReview}{' '}
          <Link href={ROUTES.auth.login} className="text-blue-600 hover:underline">
            {vi.common.signIn}
          </Link>
        </p>
      )}

      <div className="mt-8 space-y-4">
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
        ) : reviews.length === 0 ? (
          <p className="text-slate-500">{vi.product.noReviews}</p>
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-900">
                  {(r as { userName?: string }).userName ?? 'Customer'}
                </span>
                <Stars rating={r.rating} />
              </div>
              {r.comment && (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {r.comment}
                </p>
              )}
              <p className="mt-2 text-xs text-slate-400">
                {new Date(r.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
