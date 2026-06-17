import { CompanyNav } from '@/features/company/components/CompanyNav';

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
        <aside className="lg:w-56 lg:shrink-0">
          <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <CompanyNav />
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
