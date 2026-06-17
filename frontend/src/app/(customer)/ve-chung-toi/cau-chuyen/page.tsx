import type { Metadata } from 'next';
import { CompanyPageHero } from '@/features/company/components/CompanyPageHero';
import { vi } from '@/lib/i18n';

const content = vi.company.ourStory;

export const metadata: Metadata = {
  title: `${content.title} | ${vi.brand.name}`,
  description: content.subtitle,
};

export default function OurStoryPage() {
  return (
    <div className="space-y-10">
      <CompanyPageHero title={content.title} subtitle={content.subtitle} />

      <div className="space-y-5 text-base leading-relaxed text-slate-700">
        {content.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 40)}>{paragraph}</p>
        ))}
      </div>

      <blockquote className="relative rounded-xl border-l-4 border-blue-500 bg-sky-50 px-6 py-5">
        <p className="text-lg font-medium italic leading-relaxed text-slate-800">
          &ldquo;{content.quote}&rdquo;
        </p>
        <footer className="mt-3 text-sm text-slate-600">— {content.quoteAuthor}</footer>
      </blockquote>

      <section>
        <h2 className="mb-6 text-lg font-semibold text-slate-900">{content.milestonesTitle}</h2>
        <ol className="relative space-y-6 border-l-2 border-blue-100 pl-6">
          {content.milestones.map(({ year, label }) => (
            <li key={year} className="relative">
              <span className="absolute -left-[1.6rem] top-1 flex h-3 w-3 rounded-full bg-blue-500 ring-4 ring-white" />
              <span className="text-sm font-semibold text-blue-600">{year}</span>
              <p className="mt-0.5 text-sm text-slate-700">{label}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
