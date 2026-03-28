import { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useAdminNotifications } from '@/hooks/use-admin-notifications';
import { LayoutDashboard, ShoppingCart, Package, Layers, Settings, LogOut, Menu, X, ChevronRight, Ticket, Image, BarChart3, Ruler, Users, Activity, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sheet, SheetClose, SheetContent } from '@/components/ui/sheet';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'ড্যাশবোর্ড', exact: true },
  { to: '/admin/orders', icon: ShoppingCart, label: 'অর্ডার' },
  { to: '/admin/products', icon: Package, label: 'প্রোডাক্ট' },
  { to: '/admin/categories', icon: Layers, label: 'ক্যাটাগরি ও ব্র্যান্ড' },
  { to: '/admin/coupons', icon: Ticket, label: 'কুপন' },
  { to: '/admin/banners', icon: Image, label: 'ব্যানার' },
  { to: '/admin/analytics', icon: BarChart3, label: 'অ্যানালিটিক্স' },
  { to: '/admin/customers', icon: Users, label: 'কাস্টমার' },
  { to: '/admin/activity', icon: Activity, label: 'অ্যাক্টিভিটি' },
  { to: '/admin/reviews', icon: Star, label: 'রিভিউ' },
  { to: '/admin/size-charts', icon: Ruler, label: 'সাইজ চার্ট' },
  { to: '/admin/settings', icon: Settings, label: 'সেটিংস' },
];

export default function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Real-time notifications for new orders & reviews
  useAdminNotifications();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const isActive = (path: string, exact?: boolean) => exact ? location.pathname === path : location.pathname.startsWith(path);

  const renderNavLinks = (onNavigate?: () => void) => (
    <nav className="p-3 space-y-1 flex-1 min-h-0 overflow-y-auto">
      {navItems.map(item => (
        <Link
          key={item.to}
          to={item.to}
          onClick={() => onNavigate?.()}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            isActive(item.to, item.exact)
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const renderFooter = (onClose?: () => void) => (
    <div className="p-3 border-t shrink-0">
      <div className="text-xs text-muted-foreground px-3 mb-2 truncate">{user.email}</div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-muted-foreground"
        onClick={async () => {
          onClose?.();
          await handleSignOut();
        }}
      >
        <LogOut className="h-4 w-4" /> লগআউট
      </Button>
      <Link
        to="/"
        onClick={onClose}
        className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground mt-1"
      >
        <ChevronRight className="h-3 w-3" /> সাইটে যান
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile header */}
      <div className="lg:hidden sticky top-0 inset-x-0 z-50 bg-card/95 supports-[backdrop-filter]:bg-card/80 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-lg text-primary logo-font">rikapio <span className="text-foreground">Admin</span></span>
        <Button variant="ghost" size="icon" onClick={handleSignOut}><LogOut className="h-5 w-5" /></Button>
      </div>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 max-w-[85vw] p-0 [&>button]:hidden lg:hidden">
          <div className="h-full flex flex-col bg-card">
            <div className="p-4 border-b flex items-center justify-between shrink-0">
              <span className="text-xl text-primary logo-font">rikapio <span className="text-foreground">Admin</span></span>
              <SheetClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-5 w-5" />
                </Button>
              </SheetClose>
            </div>

            {renderNavLinks(() => setSidebarOpen(false))}
            {renderFooter(() => setSidebarOpen(false))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 z-40 h-full w-64 bg-card border-r flex-col">
        <div className="p-4 border-b shrink-0">
          <span className="text-xl text-primary logo-font">rikapio <span className="text-foreground">Admin</span></span>
        </div>

        {renderNavLinks()}
        {renderFooter()}
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
