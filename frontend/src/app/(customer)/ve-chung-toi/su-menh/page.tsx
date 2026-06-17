import type { Metadata } from 'next';
import { CheckCircle2 } from 'lucide-react';
import { CompanyPageHero } from '@/features/company/components/CompanyPageHero';
import { vi } from '@/lib/i18n';

const content = vi.company.mission;

export const metadata: Metadata = {
  title: `${content.title} | ${vi.brand.name}`,
  description: content.subtitle,
};

export default function MissionPage() {
  return (
    <div className="space-y-10">
      <CompanyPageHero title={content.title} subtitle={content.subtitle} />

      <p className="text-lg font-medium leading-relaxed text-slate-800">{content.lead}</p>

      <div className="space-y-5 text-base leading-relaxed text-slate-700">
        {content.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 40)}>{paragraph}</p>
        ))}
      </div>

      <section className="grid gap-5 sm:grid-cols-2">
        {content.commitments.map(({ title, description }) => (
          <div
            key={title}
            className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
            <div>
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
