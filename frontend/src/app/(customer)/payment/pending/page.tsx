import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function PaymentPendingRedirect({ searchParams }: Props) {
  const params = await searchParams;
  const q = new URLSearchParams();
  q.set('status', 'pending');
  for (const [key, val] of Object.entries(params)) {
    if (typeof val === 'string') q.set(key, val);
    else if (Array.isArray(val) && val[0]) q.set(key, val[0]);
  }
  redirect(`${ROUTES.payment.result}?${q.toString()}`);
}
