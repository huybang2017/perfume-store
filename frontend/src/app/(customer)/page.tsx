'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/common/ProductCard';
import { ProductGridSkeleton } from '@/components/common/ProductGridSkeleton';
import { productGridClass } from '@/lib/product-grid';
import { useGetProductsQuery } from '@/store/api/productApi';
import { vi } from '@/lib/i18n';
import { ROUTES } from '@/constants/routes';
import { ShopByCategorySection } from '@/features/home/components/ShopByCategorySection';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export default function HomePage() {
  const { data, isLoading } = useGetProductsQuery({
    isFeatured: true,
    status: 'active',
    limit: 15,
  });
  const products = data?.data ?? [];

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative h-[80vh] w-full overflow-hidden bg-secondary">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-60"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="relative z-10"
          >
            <motion.span variants={fadeInUp} className="text-primary text-[10px] font-bold uppercase tracking-[0.4em] mb-6 block">
              Essential Oil & Perfume
            </motion.span>
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-serif font-bold text-white tracking-widest mb-6">
              {vi.brand.name.toUpperCase()}
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-gray-400 max-w-xl mx-auto mb-10 font-serif italic text-lg md:text-xl leading-relaxed">
              &quot;{vi.brand.tagline}&quot;
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Link href={ROUTES.shop}>
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary-hover text-white px-12 py-7 rounded-sm uppercase tracking-[0.2em] text-[10px] font-bold transition-all duration-500 shadow-xl shadow-primary/20 hover:shadow-primary/40"
                >
                  {vi.home.shopCollection.toUpperCase()}
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4"
        >
          <div className="h-0.5 w-12 bg-primary"></div>
          <div className="h-0.5 w-12 bg-white/10"></div>
          <div className="h-0.5 w-12 bg-white/10"></div>
        </motion.div>
      </section>

      {/* Intro Section */}
      <section className="mx-auto max-w-7xl px-4 py-32 sm:px-6">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative aspect-[4/5] md:aspect-square overflow-hidden rounded-sm bg-secondary group shadow-2xl"
          >
            <img
              src="https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1000"
              alt="Luxury Perfume"
              className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-90"
            />
            <div className="absolute inset-5 border border-white/20 pointer-events-none transition-all duration-1000 group-hover:inset-4"></div>
          </motion.div>
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="space-y-8"
          >
            <motion.span variants={fadeInUp} className="text-primary text-[10px] font-bold uppercase tracking-[0.4em] block">
              The Art of Fragrance
            </motion.span>
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-serif font-bold text-secondary leading-tight tracking-wide">
              Complement your <br /> personality
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-text-secondary font-serif leading-relaxed text-lg italic">
              Our perfume collection is carefully curated to bring you the most exquisite and unique scents from around the world. Each bottle tells a story of elegance and sophistication.
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Link href={ROUTES.company.ourStory} className="inline-block pt-4 group">
                <span className="text-secondary text-[10px] font-bold uppercase tracking-[0.2em] border-b border-primary pb-2 group-hover:text-primary transition-colors duration-300">
                  Discover Our Story
                </span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Shop by Category */}
      <ShopByCategorySection />

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-4 py-32 sm:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20 flex flex-col items-center text-center"
        >
          <span className="text-primary text-[10px] font-bold uppercase tracking-[0.4em] mb-4 block">
            Featured
          </span>
          <h2 className="text-3xl font-serif font-bold text-secondary tracking-widest uppercase">
            {vi.home.featured}
          </h2>
          <div className="mt-6 h-px w-16 bg-primary"></div>
        </motion.div>
        
        {isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : (
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className={productGridClass}
          >
            {products.map((product) => (
              <motion.div key={product.id} variants={fadeInUp}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-20 text-center"
        >
          <Link href={ROUTES.shop}>
            <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-white rounded-sm px-14 py-7 uppercase tracking-[0.2em] text-[10px] font-bold transition-all duration-300">
              {vi.home.viewAll.toUpperCase()}
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* CTA Banner */}
      <section className="relative py-40 bg-secondary overflow-hidden">
        <motion.div 
          initial={{ scale: 1.1 }}
          whileInView={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          viewport={{ once: true }}
          className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1615634260167-c8cd6f524458?auto=format&fit=crop&q=80&w=2000')] bg-center bg-cover"
        ></motion.div>
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative mx-auto max-w-4xl px-4 text-center z-10"
        >
          <motion.span variants={fadeInUp} className="text-primary text-[10px] font-bold uppercase tracking-[0.4em] mb-6 block">
            Exclusive
          </motion.span>
          <motion.h2 variants={fadeInUp} className="text-5xl md:text-7xl font-serif font-bold text-white tracking-widest mb-8 leading-tight">
            Find Your <br /> Signature Scent
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-gray-400 font-serif italic text-lg md:text-xl mb-14 max-w-2xl mx-auto">
            Experience the luxury of premium fragrances crafted for those who appreciate the finer things in life.
          </motion.p>
          <motion.div variants={fadeInUp}>
            <Link href={ROUTES.shop}>
              <Button size="lg" className="bg-primary hover:bg-primary-hover text-white px-14 py-7 rounded-sm uppercase tracking-[0.2em] text-[10px] font-bold transition-all duration-500 shadow-xl shadow-primary/20 hover:shadow-primary/40">
                Explore Collection
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
