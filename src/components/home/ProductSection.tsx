import { ProductCard } from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/ProductCardSkeleton';
import { useLanguageStore } from '@/stores/language-store';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Product } from '@/hooks/use-products';

interface ProductSectionProps {
  title: string;
  products: Product[] | undefined;
  isLoading: boolean;
  viewAllLink?: string;
  children?: React.ReactNode;
}

export function ProductSection({ title, products, isLoading, viewAllLink, children }: ProductSectionProps) {
  const { t } = useLanguageStore();

  return (
    <section className="container-shop py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-primary to-primary/50" />
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h2>
        </div>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="group flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors px-4 py-2 rounded-full bg-primary/5 hover:bg-primary/10"
          >
            {t('viewAll')}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        )}
      </div>
      {children}
      {isLoading ? (
        <ProductGridSkeleton />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {products?.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
