'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell, LogOut, ExternalLink, Menu } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useDispatch } from 'react-redux';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/store/slices/authSlice';
import { ROUTES } from '@/constants/routes';
import { vi } from '@/lib/i18n';

interface AdminHeaderProps {
  onMenuClick?: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useAuth();

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'QT';

  const handleLogout = () => {
    dispatch(logout());
    router.push(ROUTES.auth.login);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="relative hidden max-w-md flex-1 sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder={vi.admin.searchPlaceholder} className="pl-9" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link href={ROUTES.home} className="hidden sm:block">
            <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600">
              <ExternalLink className="h-4 w-4" />
              {vi.nav.storefront}
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="relative" aria-label={vi.nav.notifications}>
            <Bell className="h-4 w-4 text-slate-600" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </Button>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-slate-50">
                <Avatar>
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium text-slate-900 lg:inline">
                  {user?.fullName}
                </span>
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[200px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
                align="end"
                sideOffset={8}
              >
                <div className="border-b border-slate-200 px-3 py-2">
                  <p className="text-sm font-medium text-slate-900">{user?.fullName}</p>
                  <p className="text-xs text-slate-600">{user?.email}</p>
                </div>
                <DropdownMenu.Item
                  className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none hover:bg-slate-50 hover:text-red-600 focus:bg-slate-50"
                  onSelect={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  {vi.common.signOut}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </header>
  );
}
