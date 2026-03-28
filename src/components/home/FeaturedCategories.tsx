import { Link } from 'react-router-dom';
import { optimizeImageUrl, generateSrcSet } from '@/lib/image-utils';
import { useCategories } from '@/hooks/use-products';
import { useLanguageStore } from '@/stores/language-store';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight } from 'lucide-react';
import { useImageRadius } from '@/hooks/use-image-radius';
import { useImageRatios } from '@/hooks/use-image-ratios';
import { motion } from 'framer-motion';

export function FeaturedCategories() {
  const { data: categories, isLoading } = useCategories();
  const { language, t } = useLanguageStore();
  const radius = useImageRadius();
  const ratios = useImageRatios();

  const aspectRatio = ratios.toCSS(ratios.categoryImage);

  if (isLoading) {
    return (
      <section className="container-shop py-10">
        <Skeleton className="h-8 w-60 mb-6" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} style={{ borderRadius: radius.category, aspectRatio }} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="container-shop py-10">
      <div className="flex flex-col items-center mb-8">
        <h2 className="text-2xl font-bold tracking-tight">{t('featuredCategories')}</h2>
        <div className="h-1 w-12 rounded-full bg-primary mt-2" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-3">
        {categories?.map((cat, index) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: index * 0.08, duration: 0.4 }}
          >
            <Link
              to={`/${cat.slug}`}
              className="group relative block overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
              style={{ borderRadius: radius.category, aspectRatio: `${aspectRatio}` }}
            >
              {/* Full background image */}
              <img
                src={optimizeImageUrl(cat.image || '/placeholder.svg', 400)}
                srcSet={generateSrcSet(cat.image || '', [300, 400, 600])}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                loading="lazy"
                decoding="async"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Subtle top shine on hover */}
              <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Text at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-3 md:p-2.5 z-10">
                <h3 className="font-bold text-white text-base md:text-sm leading-tight line-clamp-2 drop-shadow-md">
                  {language === 'bn' ? cat.name_bn : cat.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-1.5 md:mt-1">
                  <span className="text-xs font-semibold text-white/90 group-hover:text-white transition-colors duration-300">
                    Shop Now
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 md:h-3 md:w-3 text-white/80 group-hover:text-white group-hover:translate-x-1.5 transition-all duration-300" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
