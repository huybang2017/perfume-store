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
    </div>
  );
}
