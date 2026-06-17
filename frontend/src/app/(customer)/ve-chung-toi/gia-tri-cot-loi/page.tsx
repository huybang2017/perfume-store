import type { Metadata } from 'next';
import { ShieldCheck, Heart, Lightbulb, Handshake, Flame } from 'lucide-react';
import { CompanyPageHero } from '@/features/company/components/CompanyPageHero';
import { vi } from '@/lib/i18n';

const content = vi.company.coreValues;

const icons = [ShieldCheck, Heart, Lightbulb, Handshake, Flame] as const;

export const metadata: Metadata = {
  title: `${content.title} | ${vi.brand.name}`,
  description: content.subtitle,
};

export default function CoreValuesPage() {
  return (
    <div className="space-y-10">
      <CompanyPageHero title={content.title} subtitle={content.subtitle} />

      <section className="grid gap-5 sm:grid-cols-2">
        {content.items.map(({ title, description }, index) => {
          const Icon = icons[index] ?? ShieldCheck;
          return (
            <div
              key={title}
              className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
