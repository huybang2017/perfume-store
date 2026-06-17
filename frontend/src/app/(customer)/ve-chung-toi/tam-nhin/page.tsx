import type { Metadata } from 'next';
import { CompanyPageHero } from '@/features/company/components/CompanyPageHero';
import { vi } from '@/lib/i18n';

const content = vi.company.vision;

export const metadata: Metadata = {
  title: `${content.title} | ${vi.brand.name}`,
  description: content.subtitle,
};

export default function VisionPage() {
  return (
    <div className="space-y-10">
      <CompanyPageHero title={content.title} subtitle={content.subtitle} />

      <p className="text-lg font-medium leading-relaxed text-slate-800">{content.lead}</p>

      <div className="space-y-5 text-base leading-relaxed text-slate-700">
        {content.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 40)}>{paragraph}</p>
        ))}
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        {content.pillars.map(({ title, description }) => (
          <div
            key={title}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
