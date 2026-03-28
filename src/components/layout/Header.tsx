import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Menu, X, Sun, Moon, Globe, Phone, Mail, ChevronRight, Home, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cart-store';
import { useLanguageStore } from '@/stores/language-store';
import { useCategories } from '@/hooks/use-products';
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicLogo } from '@/components/DynamicLogo';
import { useCustomerAuth } from '@/hooks/use-customer-auth';
import { applyThemeMode, getInitialDarkMode, themeStorageKey } from '@/lib/theme';
import { useSiteSettings } from '@/hooks/use-site-settings';

export function Header() {
  const { language, setLanguage, t } = useLanguageStore();
  const cartCount = useCartStore((s) => s.getItemCount());
  const { data: categories } = useCategories();
  const { user } = useCustomerAuth();
  const { data: siteSettings } = useSiteSettings();

  const phone = siteSettings?.phone || '01840469120';
  const email = siteSettings?.email || 'rikapioshop@gmail.com';
  const whatsapp = siteSettings?.whatsapp || `88${phone}`;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [dark, setDark] = useState(() => getInitialDarkMode());
  const navigate = useNavigate();

  useEffect(() => {
    applyThemeMode(dark);
  }, [dark]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== themeStorageKey) return;
      if (event.newValue === 'dark') setDark(true);
      if (event.newValue === 'light') setDark(false);
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [sidebarOpen]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSidebarOpen(false);
      setMobileSearchOpen(false);
    }
  }, [searchQuery, navigate]);

  const navTo = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <>
      <header className="bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/85 border-b border-border/60">
        {/* Top utility bar - desktop */}
        <div className="hidden md:block bg-primary/5 border-b border-border/40">
          <div className="container-shop flex items-center justify-between py-1.5 text-xs">
            <div className="flex items-center gap-5">
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                <Phone className="h-3 w-3" />
                <span className="font-medium">{phone}</span>
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-3 w-3" />
                <span className="font-medium whitespace-nowrap">{email}</span>
              </a>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary"
              >
                <Globe className="h-3 w-3" />
                <span className="font-semibold">{language === 'en' ? 'বাংলা' : 'English'}</span>
              </button>
              <button
                onClick={() => setDark(!dark)}
                className="p-1.5 rounded-full hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary"
              >
                {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Main header row */}
        <div className="container-shop">
          <div className="flex items-center justify-between h-14 md:h-[60px] gap-2">
            {/* Mobile hamburger + search */}
            <div className="md:hidden flex items-center gap-0.5">
              <button
                className="flex items-center justify-center h-10 w-10 rounded-xl hover:bg-secondary active:scale-95 transition-all"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-[22px] w-[22px] text-foreground" />
              </button>
              <button
                className="flex items-center justify-center h-10 w-10 rounded-xl hover:bg-secondary active:scale-95 transition-all"
                onClick={() => setMobileSearchOpen((v) => !v)}
              >
                <Search className="h-[20px] w-[20px] text-foreground" />
              </button>
            </div>

            {/* Logo - centered on mobile, left on desktop */}
            <Link to="/" className="flex-shrink-0 md:mr-6">
              <DynamicLogo textClassName="text-[26px] md:text-[32px]" imgClassName="h-8 md:h-10" />
            </Link>

            {/* Desktop search */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
              <div className="relative w-full group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="search"
                  placeholder={t('search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-10 rounded-full bg-secondary/80 border-border/60 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 shadow-sm transition-all"
                />
              </div>
            </form>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              {/* User account icon */}
              <Link to={user ? '/account' : '/login'}>
                <button className="flex items-center justify-center h-10 w-10 rounded-xl hover:bg-secondary active:scale-95 transition-all">
                  <User className="h-[18px] w-[18px] text-foreground" />
                </button>
              </Link>

              {/* Cart */}
              <Link to="/cart" className="relative">
                <button className="flex items-center justify-center h-10 w-10 rounded-xl hover:bg-secondary active:scale-95 transition-all">
                  <ShoppingCart className="h-[18px] w-[18px] text-foreground" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1 shadow-sm">
                      {cartCount}
                    </span>
                  )}
                </button>
              </Link>
            </div>
          </div>

          {/* Mobile search bar - toggle */}
          <div className={cn(
            "md:hidden overflow-hidden transition-all duration-300 ease-out",
            mobileSearchOpen ? "max-h-14 pb-2.5 opacity-100" : "max-h-0 pb-0 opacity-0"
          )}>
            <form onSubmit={(e) => { handleSearch(e); setMobileSearchOpen(false); }}>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t('search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-full bg-secondary/80 border-border/60 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 w-full h-10 shadow-sm"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Desktop categories nav */}
        <div className="hidden md:block border-t border-border/40">
          <div className="container-shop">
            <nav className="flex items-center gap-0.5 py-1 overflow-x-auto scrollbar-hide">
              <Link
                to="/"
                className="px-3.5 py-1.5 text-sm font-semibold text-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all whitespace-nowrap"
              >
                {t('home')}
              </Link>
              {categories?.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/c/${cat.slug}`}
                  className="px-3.5 py-1.5 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all whitespace-nowrap"
                >
                  {language === 'bn' ? cat.name_bn : cat.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* ===== Mobile Sidebar (Portal to body) ===== */}
      {createPortal(
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] md:hidden"
                onClick={() => setSidebarOpen(false)}
              />

              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                className="fixed top-0 left-0 bottom-0 w-[285px] bg-background z-[101] md:hidden flex flex-col shadow-2xl"
              >
                {/* Sidebar header */}
                <div className="flex items-center justify-between px-5 h-14 border-b border-border/60">
                  <Link to="/" onClick={() => setSidebarOpen(false)}>
                    <DynamicLogo textClassName="text-[24px]" imgClassName="h-7" />
                  </Link>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-xl hover:bg-secondary transition-colors"
                  >
                    <X className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>

                {/* Sidebar body */}
                <div className="flex-1 overflow-y-auto py-2">
                  <nav className="px-3">
                    <p className="px-3 mb-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {language === 'bn' ? 'মেনু' : 'Menu'}
                    </p>
                    <button
                      onClick={() => navTo('/')}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-primary/8 hover:text-primary transition-all active:scale-[0.98]"
                    >
                      <Home className="h-4 w-4" />
                      {t('home')}
                    </button>

                    <div className="mt-3">
                      <p className="px-3 mb-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {language === 'bn' ? 'ক্যাটাগরি' : 'Categories'}
                      </p>
                      {categories?.map((cat, i) => (
                        <motion.button
                          key={cat.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => navTo(`/c/${cat.slug}`)}
                          className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-primary/8 hover:text-primary transition-all group active:scale-[0.98]"
                        >
                          <span>{language === 'bn' ? cat.name_bn : cat.name}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </motion.button>
                      ))}
                    </div>
                  </nav>

                  <div className="mx-4 my-3 border-t border-border/50" />

                  {/* Settings */}
                  <div className="px-3">
                    <p className="px-3 mb-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {language === 'bn' ? 'সেটিংস' : 'Settings'}
                    </p>

                    <button
                      onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
                      className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-primary/8 transition-all"
                    >
                      <span className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        {language === 'bn' ? 'ভাষা পরিবর্তন' : 'Change Language'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {language === 'en' ? 'বাং' : 'EN'}
                      </span>
                    </button>

                    <button
                      onClick={() => setDark(!dark)}
                      className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-primary/8 transition-all"
                    >
                      <span className="flex items-center gap-3">
                        {dark ? <Sun className="h-4 w-4 text-warning" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
                        {dark ? (language === 'bn' ? 'লাইট মোড' : 'Light Mode') : (language === 'bn' ? 'ডার্ক মোড' : 'Dark Mode')}
                      </span>
                      <div className={cn(
                        "w-9 h-[22px] rounded-full p-0.5 transition-colors duration-200",
                        dark ? "bg-primary" : "bg-muted-foreground/25"
                      )}>
                        <div className={cn(
                          "w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200",
                          dark ? "translate-x-[14px]" : "translate-x-0"
                        )} />
                      </div>
                    </button>
                  </div>
                </div>

                {/* Sidebar footer */}
                <div className="border-t border-border/60 px-5 py-4 space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    {language === 'bn' ? 'যোগাযোগ' : 'Contact'}
                  </p>
                  <a
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="font-medium">{phone}</span>
                  </a>
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="truncate font-medium">{email}</span>
                  </a>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
