import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'string') qs.set(key, value);
    else if (Array.isArray(value)) value.forEach((v) => qs.append(key, v));
  });
  const query = qs.toString();
  redirect(query ? `${ROUTES.shop}?${query}` : ROUTES.shop);
}
