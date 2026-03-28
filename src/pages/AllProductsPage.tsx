import { Link } from 'react-router-dom';
import { ShopLayout } from '@/components/layout/ShopLayout';
import { ProductCard } from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/ProductCardSkeleton';
import { useLanguageStore } from '@/stores/language-store';
import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function useAllProducts() {
  return useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export default function AllProductsPage() {
  const { t } = useLanguageStore();
  const { data: products, isLoading } = useAllProducts();
  const [sortBy, setSortBy] = useState('newest');

  const sorted = useMemo(() => {
    if (!products) return [];
    const arr = [...products];
    switch (sortBy) {
      case 'popularity': return arr.sort((a, b) => (b.rating_avg ?? 0) - (a.rating_avg ?? 0));
      case 'price-low': return arr.sort((a, b) => a.price - b.price);
      case 'price-high': return arr.sort((a, b) => b.price - a.price);
      default: return arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [products, sortBy]);

  return (
    <ShopLayout>
      <div className="container-shop py-6">
        <nav className="text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-foreground">{t('home')}</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">All Products</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-3xl font-bold">All Products</h1>
        </div>

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

        {isLoading ? (
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
