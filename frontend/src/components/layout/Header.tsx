'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown, ShoppingBag, LogOut, User, LayoutGrid } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { useGetCartQuery } from '@/store/api/cartApi';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/store/slices/authSlice';
import { vi } from '@/lib/i18n';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: ROUTES.home, label: vi.nav.home },
  { href: ROUTES.shop, label: vi.nav.shop },
];

const aboutLinks = [
  { href: ROUTES.company.ourStory, label: vi.company.nav.ourStory },
  { href: ROUTES.company.vision, label: vi.company.nav.vision },
  { href: ROUTES.company.mission, label: vi.company.nav.mission },
  { href: ROUTES.company.coreValues, label: vi.company.nav.coreValues },
];

export function Header() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { isAuthenticated, user, isAdmin } = useAuth();
  const { data: cartData } = useGetCartQuery(undefined, {
    skip: !mounted || !isAuthenticated,
  });
  const itemCount = cartData?.data?.itemCount ?? 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    router.push(ROUTES.home);
  };

  const isAboutActive = pathname.startsWith('/ve-chung-toi');

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href={ROUTES.home}
          className="flex items-center gap-2 text-xl font-serif font-bold tracking-widest text-secondary"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-sm text-white font-sans">
            S
          </span>
          {vi.brand.name.toUpperCase()}
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'rounded-sm px-4 py-2 text-xs uppercase tracking-widest font-medium transition-colors',
                pathname === href
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-secondary hover:text-primary',
              )}
            >
              {label}
            </Link>
          ))}
          <div className="group relative">
            <Link
              href={ROUTES.company.ourStory}
              className={cn(
                'flex items-center gap-1 rounded-sm px-4 py-2 text-xs uppercase tracking-widest font-medium transition-colors',
                isAboutActive
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-secondary hover:text-primary',
              )}
            >
              {vi.nav.about}
              <ChevronDown className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:rotate-180" />
            </Link>
            <div className="invisible absolute left-0 top-full z-50 pt-1 opacity-0 transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="min-w-[12rem] rounded-sm border border-border bg-white py-2 shadow-lg">
                {aboutLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'block px-4 py-2 text-[10px] uppercase tracking-widest transition-colors hover:bg-surface hover:text-primary',
                      pathname === href
                        ? 'font-bold text-primary'
                        : 'text-text-secondary',
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {mounted && isAuthenticated && (
            <>
            <Link
              href={ROUTES.account.orders}
              className={cn(
                'hidden rounded-sm px-4 py-2 text-xs uppercase tracking-widest font-medium transition-colors md:block',
                pathname.startsWith('/tai-khoan')
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-secondary hover:text-primary',
              )}
            >
              {vi.order.myOrders}
            </Link>
            <Link
              href={ROUTES.cart}
              className={cn(
                'rounded-sm px-4 py-2 text-xs uppercase tracking-widest font-medium transition-colors',
                pathname === ROUTES.cart
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-secondary hover:text-primary',
              )}
            >
              {vi.nav.cart}
            </Link>
            </>
          )}
          {isAdmin && (
            <Link
              href={ROUTES.admin.dashboard}
              className={cn(
                'flex items-center gap-1.5 rounded-sm px-4 py-2 text-xs uppercase tracking-widest font-medium transition-colors',
                pathname.startsWith('/admin')
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-secondary hover:text-primary',
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              {vi.nav.admin}
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {mounted && isAuthenticated && (
            <Link href={ROUTES.cart} className="relative md:hidden">
              <Button variant="ghost" size="icon" aria-label={vi.nav.cart}>
                <ShoppingBag className="h-4 w-4" />
              </Button>
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>
          )}
          {mounted && isAuthenticated ? (
            <>
              <span className="hidden items-center gap-1.5 text-sm text-slate-600 sm:flex">
                <User className="h-4 w-4" />
                {user?.fullName}
              </span>
              <Button variant="ghost" size="icon" onClick={handleLogout} aria-label={vi.common.signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href={ROUTES.auth.register} className="hidden sm:block">
                <Button variant="outline" size="sm">
                  {vi.common.register}
                </Button>
              </Link>
              <Link href={ROUTES.auth.login}>
                <Button size="sm">{vi.common.signIn}</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
