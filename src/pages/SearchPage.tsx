import { useSearchParams, Link } from 'react-router-dom';
import { ShopLayout } from '@/components/layout/ShopLayout';
import { ProductCard } from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/ProductCardSkeleton';
import { useSearchProducts } from '@/hooks/use-products';
import { useLanguageStore } from '@/stores/language-store';

export default function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get('q') || '';
  const { t } = useLanguageStore();
  const { data: products, isLoading } = useSearchProducts(query);

  return (
    <ShopLayout>
      <div className="container-shop py-6">
        <nav className="text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-foreground">{t('home')}</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{t('searchResults')}</span>
        </nav>

        <h1 className="text-2xl font-bold mb-2">{t('searchResults')}</h1>
        <p className="text-muted-foreground mb-6">
          "{query}" — {products?.length ?? 0} {t('products')}
        </p>

        {isLoading ? (
          <ProductGridSkeleton />
        ) : !products?.length ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">{t('noResults')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
