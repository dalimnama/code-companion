import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { lazy, Suspense, useEffect, ReactNode } from "react";
import { useTrackVisitor } from "./hooks/use-track-visitor";
import { useDynamicColors } from "./hooks/use-dynamic-colors";
import { seedQueryCache } from "./lib/prefetch-seed";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// ── Eager-loaded: only truly critical for first interaction ──
import CategoryPage from "./pages/CategoryPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import AllProductsPage from "./pages/AllProductsPage";
import SearchPage from "./pages/SearchPage";

// ── Eager-loaded: bottom nav pages for instant navigation ──
import CartPage from "./pages/CartPage";
import WishlistPage from "./pages/WishlistPage";
import AccountPage from "./pages/AccountPage";
import ContactPage from "./pages/ContactPage";

// ── Lazy-loaded ──
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));

const routeFactories = {
  orderSuccess: () => import("./pages/OrderSuccessPage"),
  about: () => import("./pages/AboutPage"),
  privacy: () => import("./pages/PrivacyPolicyPage"),
  terms: () => import("./pages/TermsPage"),
  returnPolicy: () => import("./pages/ReturnPolicyPage"),
  shipping: () => import("./pages/ShippingPolicyPage"),
  trackOrder: () => import("./pages/TrackOrderPage"),
  trackSearch: () => import("./pages/TrackOrderSearchPage"),
  login: () => import("./pages/LoginPage"),
  register: () => import("./pages/RegisterPage"),
  forgotPassword: () => import("./pages/ForgotPasswordPage"),
  resetPassword: () => import("./pages/ResetPasswordPage"),
  adminLogin: () => import("./pages/admin/AdminLoginPage"),
  adminForgotPassword: () => import("./pages/admin/AdminForgotPasswordPage"),
  adminLayout: () => import("./components/admin/AdminLayout"),
  adminDash: () => import("./pages/admin/AdminDashboard"),
  adminOrders: () => import("./pages/admin/AdminOrdersPage"),
  adminProducts: () => import("./pages/admin/AdminProductsPage"),
  adminCategories: () => import("./pages/admin/AdminCategoriesPage"),
  adminSettings: () => import("./pages/admin/AdminSettingsPage"),
  adminCoupons: () => import("./pages/admin/AdminCouponsPage"),
  adminBanners: () => import("./pages/admin/AdminBannersPage"),
  adminAnalytics: () => import("./pages/admin/AdminAnalyticsPage"),
  adminSizeCharts: () => import("./pages/admin/AdminSizeChartsPage"),
  adminCustomers: () => import("./pages/admin/AdminCustomersPage"),
  adminActivity: () => import("./pages/admin/AdminActivityPage"),
  adminReviews: () => import("./pages/admin/AdminReviewsPage"),
};

const OrderSuccessPage = lazy(routeFactories.orderSuccess);
const AboutPage = lazy(routeFactories.about);
const PrivacyPolicyPage = lazy(routeFactories.privacy);
const TermsPage = lazy(routeFactories.terms);
const ReturnPolicyPage = lazy(routeFactories.returnPolicy);
const ShippingPolicyPage = lazy(routeFactories.shipping);
const TrackOrderPage = lazy(routeFactories.trackOrder);
const TrackOrderSearchPage = lazy(routeFactories.trackSearch);
const LoginPage = lazy(routeFactories.login);
const RegisterPage = lazy(routeFactories.register);
const ForgotPasswordPage = lazy(routeFactories.forgotPassword);
const ResetPasswordPage = lazy(routeFactories.resetPassword);
const AdminLoginPage = lazy(routeFactories.adminLogin);
const AdminForgotPasswordPage = lazy(routeFactories.adminForgotPassword);
const AdminLayout = lazy(routeFactories.adminLayout);
const AdminDashboard = lazy(routeFactories.adminDash);
const AdminOrdersPage = lazy(routeFactories.adminOrders);
const AdminProductsPage = lazy(routeFactories.adminProducts);
const AdminCategoriesPage = lazy(routeFactories.adminCategories);
const AdminSettingsPage = lazy(routeFactories.adminSettings);
const AdminCouponsPage = lazy(routeFactories.adminCoupons);
const AdminBannersPage = lazy(routeFactories.adminBanners);
const AdminAnalyticsPage = lazy(routeFactories.adminAnalytics);
const AdminSizeChartsPage = lazy(routeFactories.adminSizeCharts);
const AdminCustomersPage = lazy(routeFactories.adminCustomers);
const AdminActivityPage = lazy(routeFactories.adminActivity);
const AdminReviewsPage = lazy(routeFactories.adminReviews);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 15,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Seed cache from pre-fetched data (non-blocking)
seedQueryCache(queryClient);

// Prefetch admin routes on decent network
function usePrefetchRoutes() {
  useEffect(() => {
    const prefetchAll = () => {
      Object.values(routeFactories).forEach((factory) => {
        void factory().catch(() => {
          // ignore prefetch failures (e.g. stale chunks); recovery is handled globally
        });
      });
    };

    const ric = (window as any).requestIdleCallback as ((cb: () => void, opts?: { timeout: number }) => number) | undefined;
    if (ric) {
      const id = ric(prefetchAll, { timeout: 3000 });
      return () => (window as any).cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(prefetchAll, 1500);
    return () => clearTimeout(t);
  }, []);
}

// Ultra-fast fade-in wrapper
function FadeIn({ children }: { children: ReactNode }) {
  return (
    <div className="animate-fade-in" style={{ animationDuration: '150ms' }}>
      {children}
    </div>
  );
}

// Suspense fallback - quick skeleton instead of spinner
const PageLoader = () => (
  <div className="min-h-[60vh]" />
);

function AppRoutes() {
  usePrefetchRoutes();
  useTrackVisitor();
  useDynamicColors();
  return (
    <Suspense fallback={<PageLoader />}>
      <FadeIn key={undefined}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/:slug" element={<CategoryPage />} />
          <Route path="/all-products" element={<AllProductsPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/p/:slug" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route path="/track-order" element={<TrackOrderSearchPage />} />
          <Route path="/track-order/:orderId" element={<TrackOrderPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/return-policy" element={<ReturnPolicyPage />} />
          <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
          
          {/* Customer Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/account" element={<AccountPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="coupons" element={<AdminCouponsPage />} />
            <Route path="banners" element={<AdminBannersPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="size-charts" element={<AdminSizeChartsPage />} />
            <Route path="customers" element={<AdminCustomersPage />} />
            <Route path="activity" element={<AdminActivityPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
            <Route path="settings/*" element={<AdminSettingsPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </FadeIn>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

