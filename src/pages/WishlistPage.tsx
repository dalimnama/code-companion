import { Link } from 'react-router-dom';
import { ShopLayout } from '@/components/layout/ShopLayout';
import { ProductCard } from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/ProductCardSkeleton';
import { useWishlistStore } from '@/stores/wishlist-store';
import { useLanguageStore } from '@/stores/language-store';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Heart } from 'lucide-react';

export default function WishlistPage() {
  const { t } = useLanguageStore();
  const wishlistIds = useWishlistStore((s) => s.items);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', 'wishlist', wishlistIds],
    queryFn: async () => {
      if (wishlistIds.length === 0) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', wishlistIds)
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
    enabled: wishlistIds.length > 0,
  });

  return (
    <ShopLayout>
      <div className="container-shop py-6">
        <nav className="text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-foreground">{t('home')}</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Wishlist</span>
        </nav>

        <div className="flex items-center gap-2 mb-6">
          <Heart className="h-6 w-6 text-sale fill-sale" />
          <h1 className="text-2xl font-bold">Wishlist</h1>
          <span className="text-sm text-muted-foreground">({wishlistIds.length})</span>
        </div>

        {isLoading ? (
          <ProductGridSkeleton />
        ) : !wishlistIds.length || !products?.length ? (
          <div className="text-center py-20">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-lg mb-2">আপনার উইশলিস্ট খালি</p>
            <p className="text-muted-foreground text-sm">প্রোডাক্টে ❤️ চিহ্ন দিয়ে এখানে যোগ করুন</p>
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
