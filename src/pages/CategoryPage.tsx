import { useParams, Link } from 'react-router-dom';
import { ShopLayout } from '@/components/layout/ShopLayout';
import { ProductCard } from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/ProductCardSkeleton';
import { useCategoryBySlug, useProductsByCategory, useSuperProducts, useMegaProducts } from '@/hooks/use-products';
import { useLanguageStore } from '@/stores/language-store';
import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { language, t } = useLanguageStore();
  const isSpecial = slug === 'super' || slug === 'mega';
  const { data: category, isLoading: catLoading } = useCategoryBySlug(slug || '');
  const { data: catProducts, isLoading: catProdLoading } = useProductsByCategory(isSpecial ? undefined : category?.id);
  const { data: superProducts, isLoading: superLoading } = useSuperProducts();
  const { data: megaProducts, isLoading: megaLoading } = useMegaProducts();
  
  const products = isSpecial 
    ? (slug === 'super' ? superProducts : megaProducts) 
    : catProducts;
  const prodLoading = isSpecial 
    ? (slug === 'super' ? superLoading : megaLoading) 
    : catProdLoading;
  const [sortBy, setSortBy] = useState('popularity');

  const sorted = useMemo(() => {
    if (!products) return [];
    const arr = [...products];
    switch (sortBy) {
      case 'newest': return arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'price-low': return arr.sort((a, b) => a.price - b.price);
      case 'price-high': return arr.sort((a, b) => b.price - a.price);
      default: return arr.sort((a, b) => (b.rating_avg ?? 0) - (a.rating_avg ?? 0));
    }
  }, [products, sortBy]);

  return (
    <ShopLayout>
      <div className="container-shop py-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-foreground">{t('home')}</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{catLoading ? '...' : (language === 'bn' ? category?.name_bn : category?.name)}</span>
        </nav>

        {/* Category Header */}
        {catLoading ? (
          <Skeleton className="h-10 w-48 mb-6" />
        ) : (
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{language === 'bn' ? category?.name_bn : category?.name}</h1>
            {category?.description && (
              <p className="text-muted-foreground mt-2">{category.description}</p>
            )}
          </div>
        )}

        {/* Sort bar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {sorted.length} {t('products')}
          </p>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity">{t('popularity')}</SelectItem>
              <SelectItem value="newest">{t('newest')}</SelectItem>
              <SelectItem value="price-low">{t('priceLowHigh')}</SelectItem>
              <SelectItem value="price-high">{t('priceHighLow')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products */}
        {prodLoading ? (
          <ProductGridSkeleton />
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">{t('noResults')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {sorted.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
