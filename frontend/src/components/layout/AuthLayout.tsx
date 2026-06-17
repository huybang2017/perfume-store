import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { vi } from '@/lib/i18n';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 overflow-hidden bg-secondary lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Link
          href={ROUTES.home}
          className="text-sm font-bold uppercase tracking-[0.3em] text-white"
        >
          {vi.brand.name}
        </Link>
        <div className="max-w-md">
          <h2 className="font-serif text-4xl font-bold leading-tight tracking-wide text-white">
            {vi.auth.heroTitle}
          </h2>
          <div className="my-6 h-0.5 w-12 bg-primary" />
          <p className="font-serif text-base italic leading-relaxed text-white/70">
            {vi.auth.heroSubtitle}
          </p>
        </div>
        <p className="text-xs uppercase tracking-widest text-white/40">
          © {new Date().getFullYear()} {vi.brand.name}
        </p>
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>
      <div className="flex w-full flex-col justify-center bg-surface px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mb-8 lg:hidden">
          <Link
            href={ROUTES.home}
            className="text-sm font-bold uppercase tracking-[0.3em] text-primary"
          >
            {vi.brand.name}
          </Link>
        </div>
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold tracking-wide text-secondary">
              {title}
            </h1>
            <div className="mt-3 h-0.5 w-10 bg-primary" />
            <p className="mt-4 text-sm text-text-secondary">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
