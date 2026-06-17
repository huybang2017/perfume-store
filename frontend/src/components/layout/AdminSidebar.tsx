'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Tags,
  Award,
  Warehouse,
  ShoppingCart,
  CreditCard,
  Users,
  Ticket,
  MessageCircle,
  MessageSquare,
  Settings,
  UserCog,
  Layers,
  ChevronLeft,
  ChevronRight,
  Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import { vi } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

const links = [
  { href: ROUTES.admin.dashboard, label: vi.admin.dashboard, icon: LayoutDashboard },
  { href: ROUTES.admin.products, label: vi.admin.products, icon: Package },
  { href: ROUTES.admin.variants, label: vi.admin.variants, icon: Layers },
  { href: ROUTES.admin.reviews, label: vi.admin.reviews, icon: MessageSquare },
  { href: ROUTES.admin.categories, label: vi.admin.categories, icon: Tags },
  { href: ROUTES.admin.brands, label: vi.admin.brands, icon: Award },
  { href: ROUTES.admin.inventory, label: vi.admin.inventory, icon: Warehouse },
  { href: ROUTES.admin.orders, label: vi.admin.orders, icon: ShoppingCart },
  { href: ROUTES.admin.payments, label: vi.admin.payments, icon: CreditCard },
  { href: ROUTES.admin.customers, label: vi.admin.customers, icon: Users },
  { href: ROUTES.admin.vouchers, label: vi.admin.vouchers, icon: Ticket },
  { href: ROUTES.admin.chat, label: vi.admin.chat, icon: MessageCircle },
  { href: ROUTES.admin.settings, label: vi.admin.settings, icon: Settings },
  { href: ROUTES.admin.users, label: vi.admin.users, icon: UserCog },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col border-r border-slate-200 bg-white transition-all duration-300 md:flex',
        collapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      <div
        className={cn(
          'flex h-16 items-center border-b border-slate-200 px-4',
          collapsed ? 'justify-center' : 'justify-between',
        )}
      >
        {!collapsed && (
          <Link href={ROUTES.admin.dashboard} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Store className="h-4 w-4" />
            </div>
            <span className="font-semibold text-slate-900">{vi.brand.name}</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 shrink-0"
          aria-label={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                collapsed && 'justify-center px-2',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
      {!collapsed && (
        <div className="border-t border-slate-200 p-4">
          <p className="text-xs text-slate-400">{vi.admin.version}</p>
        </div>
      )}
    </aside>
  );
}
