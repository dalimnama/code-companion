import { ShopLayout } from '@/components/layout/ShopLayout';
import { HeroBanner } from '@/components/home/HeroBanner';
import { FeaturedCategories } from '@/components/home/FeaturedCategories';
import { ProductSection } from '@/components/home/ProductSection';
import { CountdownTimer } from '@/components/home/CountdownTimer';
import { TrustBadges } from '@/components/home/TrustBadges';
import { CustomerReviews } from '@/components/home/CustomerReviews';
import { useFeaturedProducts, useNewProducts, useFlashSaleProducts } from '@/hooks/use-products';
import { useLanguageStore } from '@/stores/language-store';
import { useSiteSettings } from '@/hooks/use-site-settings';

const Index = () => {
  const { t } = useLanguageStore();
  const { data: siteSettings } = useSiteSettings();
  const featured = useFeaturedProducts();
  const newProducts = useNewProducts();
  const flashSale = useFlashSaleProducts();

  const flashSaleEnd = flashSale.data?.find((p) => p.flash_sale_end)?.flash_sale_end;

  return (
    <ShopLayout>
      {/* Hero */}
      <section className="container-shop pt-6">
        <HeroBanner />
      </section>

      {/* Categories */}
      <FeaturedCategories />

      {/* Best Sellers */}
      <ProductSection
        title={t('bestSellers')}
        products={featured.data}
        isLoading={featured.isLoading}
        viewAllLink="/all-products"
      />

      {/* Flash Sale */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-sale/5 via-sale/10 to-sale/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--sale)/0.12),transparent_70%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sale/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-sale/30 to-transparent" />
        <div className="relative">
          <ProductSection
            title={`🔥 ${t('flashSale')}`}
            products={flashSale.data}
            isLoading={flashSale.isLoading}
          >
            {flashSaleEnd && (
              <div className="mb-6">
                <CountdownTimer endDate={flashSaleEnd} />
              </div>
            )}
          </ProductSection>
        </div>
      </div>

      {/* New Arrivals */}
      <ProductSection
        title={t('newArrivals')}
        products={newProducts.data}
        isLoading={newProducts.isLoading}
      />

      {/* Customer Reviews */}
      {siteSettings?.show_customer_reviews !== 'false' && <CustomerReviews />}

      {/* Trust Badges */}
      {siteSettings?.show_trust_badges !== 'false' && <TrustBadges />}
    </ShopLayout>
  );
};

export default Index;
