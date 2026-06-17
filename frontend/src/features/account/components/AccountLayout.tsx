'use client';

import { CustomerAuthGuard } from '@/components/guards/CustomerAuthGuard';
import { AccountSidebar } from '@/features/orders/components/AccountSidebar';
import { vi } from '@/lib/i18n';

export function AccountLayout({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <CustomerAuthGuard>
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
        <h1 className="mb-8 text-3xl font-serif font-bold tracking-widest text-secondary uppercase">
          {title ?? vi.account.title}
        </h1>
        <div className="flex flex-col gap-8 lg:flex-row">
          <AccountSidebar />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </CustomerAuthGuard>
  );
}
