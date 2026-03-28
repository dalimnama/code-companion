import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatBDT } from '@/lib/format';
import { ShoppingCart, Package, TrendingUp, Clock } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [ordersRes, productsRes, pendingRes] = await Promise.all([
        supabase.from('orders').select('total, status', { count: 'exact' }),
        supabase.from('products').select('id', { count: 'exact' }),
        supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'pending'),
      ]);
      const totalRevenue = ordersRes.data?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
      return {
        totalOrders: ordersRes.count || 0,
        totalProducts: productsRes.count || 0,
        pendingOrders: pendingRes.count || 0,
        totalRevenue,
      };
    },
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5);
      return data || [];
    },
  });

  const cards = [
    { label: 'মোট অর্ডার', value: stats?.totalOrders || 0, icon: ShoppingCart, color: 'text-blue-600 bg-blue-100' },
    { label: 'পেন্ডিং অর্ডার', value: stats?.pendingOrders || 0, icon: Clock, color: 'text-orange-600 bg-orange-100' },
    { label: 'মোট প্রোডাক্ট', value: stats?.totalProducts || 0, icon: Package, color: 'text-green-600 bg-green-100' },
    { label: 'মোট আয়', value: formatBDT(stats?.totalRevenue || 0), icon: TrendingUp, color: 'text-purple-600 bg-purple-100' },
  ];

  const statusLabel: Record<string, string> = {
    pending: 'পেন্ডিং',
    processing: 'প্রসেসিং',
    shipped: 'শিপড',
    delivered: 'ডেলিভারড',
    cancelled: 'বাতিল',
  };

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader>
        <h1 className="text-2xl font-bold">ড্যাশবোর্ড</h1>
      </AdminPageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.label} className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-lg font-bold">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border rounded-xl p-5">
        <h2 className="font-bold mb-4">সাম্প্রতিক অর্ডার</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium">অর্ডার আইডি</th>
                <th className="pb-2 font-medium">কাস্টমার</th>
                <th className="pb-2 font-medium">মোট</th>
                <th className="pb-2 font-medium">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders?.map(order => (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="py-2.5 font-mono text-xs">{order.order_id}</td>
                  <td className="py-2.5">{order.customer_name}</td>
                  <td className="py-2.5">{formatBDT(order.total)}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[order.status] || ''}`}>
                      {statusLabel[order.status] || order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
