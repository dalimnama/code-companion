import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatBDT } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Eye, Package, Clock } from 'lucide-react';

const statusOptions = [
  { value: 'pending', label: 'পেন্ডিং' },
  { value: 'confirmed', label: 'কনফার্মড' },
  { value: 'processing', label: 'প্রসেসিং' },
  { value: 'shipped', label: 'শিপড' },
  { value: 'delivered', label: 'ডেলিভারড' },
  { value: 'cancelled', label: 'বাতিল' },
];

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-cyan-100 text-cyan-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

function useOrders(filterStatus: string) {
  return useQuery({
    queryKey: ['admin-orders', filterStatus],
    queryFn: async () => {
      let q = supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (filterStatus !== 'all') q = q.eq('status', filterStatus);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
}

function useStatusMutation() {
  const queryClient = useQueryClient();

  const sendStatusEmail = async (order: any, newStatus: string) => {
    if (!['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(newStatus)) return;
    if (!order.customer_email) return;
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      await fetch(`${supabaseUrl}/functions/v1/send-order-status-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order, status: newStatus }),
      });
    } catch (e) { console.error('Status email failed:', e); }
  };

  const syncStatusToAirtable = async (orderId: string, status: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      await fetch(`${supabaseUrl}/functions/v1/sync-airtable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', order_id: orderId, status }),
      });
    } catch (e) { console.error('Airtable status sync failed:', e); }
  };

  return useMutation({
    mutationFn: async ({ id, status, order }: { id: string; status: string; order: any }) => {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
      sendStatusEmail(order, status);
      syncStatusToAirtable(order.order_id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('অর্ডার স্ট্যাটাস আপডেট হয়েছে');
    },
    onError: () => toast.error('আপডেট ব্যর্থ হয়েছে'),
  });
}

function OrderTable({ orders, isLoading, onView, updateStatus, showFilter = true }: {
  orders: any[] | undefined;
  isLoading: boolean;
  onView: (order: any) => void;
  updateStatus: ReturnType<typeof useStatusMutation>;
  showFilter?: boolean;
}) {
  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-3 font-medium">অর্ডার আইডি</th>
              <th className="p-3 font-medium">কাস্টমার</th>
              <th className="p-3 font-medium hidden md:table-cell">ফোন</th>
              <th className="p-3 font-medium">মোট</th>
              <th className="p-3 font-medium">স্ট্যাটাস</th>
              <th className="p-3 font-medium">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">লোড হচ্ছে...</td></tr>
            ) : orders?.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">কোনো অর্ডার নেই</td></tr>
            ) : orders?.map(order => (
              <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-3 font-mono text-xs">{order.order_id}</td>
                <td className="p-3">{order.customer_name}</td>
                <td className="p-3 hidden md:table-cell">{order.customer_phone}</td>
                <td className="p-3 font-medium">{formatBDT(order.total)}</td>
                <td className="p-3">
                  <Select
                    value={order.status}
                    onValueChange={(val) => updateStatus.mutate({ id: order.id, status: val, order })}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[order.status] || ''}`}>
                        {statusOptions.find(s => s.value === order.status)?.label || order.status}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-3">
                  <Button variant="ghost" size="icon" onClick={() => onView(order)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderDetailDialog({ order, onClose }: { order: any; onClose: () => void }) {
  if (!order) return null;
  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> অর্ডার বিস্তারিত</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="space-y-1">
            <p><strong>অর্ডার আইডি:</strong> {order.order_id}</p>
            <p><strong>তারিখ:</strong> {new Date(order.created_at).toLocaleString('bn-BD')}</p>
          </div>
          <div className="space-y-1 border-t pt-3">
            <p className="font-bold">কাস্টমার তথ্য</p>
            <p>নাম: {order.customer_name}</p>
            <p>ফোন: {order.customer_phone}</p>
            <p>ইমেইল: {order.customer_email}</p>
            <p>ঠিকানা: {order.address}, {order.area}, {order.city}</p>
          </div>
          <div className="space-y-2 border-t pt-3">
            <p className="font-bold">প্রোডাক্ট</p>
            {(order.items as any[])?.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3 border rounded-lg p-2">
                <img src={item.image} alt={item.title} className="w-12 h-12 rounded object-cover" />
                <div className="flex-1">
                  <p className="font-medium text-xs">{item.title}{item.size ? ` (${item.size})` : ''}</p>
                  <p className="text-xs text-muted-foreground">× {item.quantity}</p>
                </div>
                <p className="font-medium text-xs">{formatBDT(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 space-y-1">
            <p>সাবটোটাল: {formatBDT(order.subtotal)}</p>
            <p>শিপিং: {formatBDT(order.shipping_cost)}</p>
            {order.discount_amount > 0 && <p>ডিসকাউন্ট: -{formatBDT(order.discount_amount)}</p>}
            <p className="font-bold text-lg">মোট: {formatBDT(order.total)}</p>
          </div>
          <div className="border-t pt-3 space-y-1">
            <p><strong>পেমেন্ট:</strong> {order.payment_method === 'cod' ? 'ক্যাশ অন ডেলিভারি' : order.payment_method === 'bkash' ? 'বিকাশ' : 'নগদ'}</p>
            {order.transaction_id && <p><strong>TxnID:</strong> {order.transaction_id}</p>}
            {order.notes && <p><strong>নোট:</strong> {order.notes}</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminOrdersPage() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { data: allOrders, isLoading: allLoading } = useOrders(filterStatus);
  const { data: pendingOrders, isLoading: pendingLoading } = useOrders('pending');
  const updateStatus = useStatusMutation();

  return (
    <div className="space-y-4">
      <div className="bg-muted/95 supports-[backdrop-filter]:bg-muted/85 backdrop-blur-md py-3 mb-4 border-b border-border/50 shadow-sm">
        <h1 className="text-2xl font-bold">অর্ডার ম্যানেজমেন্ট</h1>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            সব অর্ডার
            {allOrders && <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{allOrders.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            পেন্ডিং অর্ডার
            {pendingOrders && <span className="ml-1 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full">{pendingOrders.length}</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          <div className="flex justify-end">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-40 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="all">সব অর্ডার</option>
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <OrderTable orders={allOrders} isLoading={allLoading} onView={setSelectedOrder} updateStatus={updateStatus} />
        </TabsContent>

        <TabsContent value="pending">
          <OrderTable orders={pendingOrders} isLoading={pendingLoading} onView={setSelectedOrder} updateStatus={updateStatus} />
        </TabsContent>
      </Tabs>

      <OrderDetailDialog order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}