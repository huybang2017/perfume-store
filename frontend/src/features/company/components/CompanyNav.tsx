'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Eye, Heart, Sparkles } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { vi } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const links = [
  { href: ROUTES.company.ourStory, label: vi.company.nav.ourStory, icon: BookOpen },
  { href: ROUTES.company.vision, label: vi.company.nav.vision, icon: Eye },
  { href: ROUTES.company.mission, label: vi.company.nav.mission, icon: Heart },
  { href: ROUTES.company.coreValues, label: vi.company.nav.coreValues, icon: Sparkles },
] as const;

export function CompanyNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 bg-white p-4 border border-border rounded-sm shadow-sm">
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-secondary border-b border-border pb-3">
        {vi.company.sectionTitle}
      </p>
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 rounded-sm px-3 py-2.5 text-[10px] uppercase tracking-widest font-bold transition-colors',
              active
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:bg-surface hover:text-primary',
            )}
          >
            <Icon className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-white' : 'opacity-60')} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
