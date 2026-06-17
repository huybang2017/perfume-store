import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { vi } from '@/lib/i18n';

const shopLinks = [
  { href: ROUTES.home, label: vi.nav.home },
  { href: ROUTES.shop, label: vi.nav.shop },
  { href: ROUTES.shop, label: vi.footer.allProducts },
];

const accountLinks = [
  { href: ROUTES.auth.login, label: vi.common.signIn },
  { href: ROUTES.auth.register, label: vi.common.register },
  { href: ROUTES.cart, label: vi.nav.cart },
];

const aboutLinks = [
  { href: ROUTES.company.ourStory, label: vi.company.nav.ourStory },
  { href: ROUTES.company.vision, label: vi.company.nav.vision },
  { href: ROUTES.company.mission, label: vi.company.nav.mission },
  { href: ROUTES.company.coreValues, label: vi.company.nav.coreValues },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-secondary bg-secondary text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Link href={ROUTES.home} className="inline-flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary text-sm font-bold text-white shadow-sm">
                S
              </span>
              <span className="text-xl font-serif font-bold tracking-widest">{vi.brand.name.toUpperCase()}</span>
            </Link>
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-gray-400 font-serif italic">
              {vi.brand.tagline}
            </p>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              {vi.footer.shop}
            </h3>
            <nav className="mt-6 flex flex-col gap-4">
              {shopLinks.map(({ href, label }) => (
                <Link
                  key={`${href}-${label}`}
                  href={href}
                  className="text-xs uppercase tracking-widest text-gray-400 transition-colors hover:text-primary"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              {vi.footer.account}
            </h3>
            <nav className="mt-6 flex flex-col gap-4">
              {accountLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-xs uppercase tracking-widest text-gray-400 transition-colors hover:text-primary"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="lg:col-span-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              {vi.footer.contact}
            </h3>
            <ul className="mt-6 space-y-4 text-xs tracking-widest text-gray-400">
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a
                  href={`mailto:${vi.footer.email}`}
                  className="transition-colors hover:text-primary"
                >
                  {vi.footer.email.toUpperCase()}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span>{vi.footer.phone}</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span className="leading-relaxed">{vi.footer.address.toUpperCase()}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 bg-black py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
            © {new Date().getFullYear()} {vi.brand.copyright.toUpperCase()}
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600">
            {vi.footer.crafted.toUpperCase()}
          </p>
        </div>
      </div>
    </footer>
  );
}
