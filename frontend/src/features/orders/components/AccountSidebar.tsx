'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { KeyRound, MapPin, Package, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import { vi } from '@/lib/i18n';

const links = [
  { href: ROUTES.account.orders, label: vi.account.orders, icon: Package },
  { href: ROUTES.account.profile, label: vi.account.profile, icon: User },
  { href: ROUTES.account.password, label: vi.account.changePassword, icon: KeyRound },
  { href: ROUTES.account.addresses, label: vi.account.addressBook, icon: MapPin },
];

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 lg:w-56">
      <nav className="flex gap-2 overflow-x-auto rounded-sm border border-border bg-white p-2 lg:flex-col lg:overflow-visible lg:p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 whitespace-nowrap rounded-sm px-3 py-2.5 text-[10px] uppercase tracking-widest font-bold transition-colors',
                active
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:bg-surface hover:text-primary',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
