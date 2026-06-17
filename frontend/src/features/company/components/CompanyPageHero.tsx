interface CompanyPageHeroProps {
  title: string;
  subtitle: string;
}

export function CompanyPageHero({ title, subtitle }: CompanyPageHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-sm bg-secondary px-6 py-10 text-white shadow-sm sm:px-10 sm:py-16">
      <div className="pointer-events-none absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1000')] bg-center bg-cover"></div>
      <div className="relative text-center">
        <h1 className="text-3xl font-serif font-bold tracking-widest uppercase md:text-4xl">{title}</h1>
        <div className="mt-4 h-0.5 w-12 bg-primary mx-auto mb-4"></div>
        <p className="max-w-2xl mx-auto text-sm leading-relaxed text-gray-300 font-serif italic sm:text-lg">{subtitle}</p>
      </div>
    </div>
  );
}
