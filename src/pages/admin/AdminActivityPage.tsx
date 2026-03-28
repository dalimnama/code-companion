import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, ShoppingCart, Trash2, CreditCard, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { format } from 'date-fns';

const EVENT_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  add_to_cart: { label: 'কার্টে যোগ', color: 'bg-blue-100 text-blue-800', icon: ShoppingCart },
  remove_from_cart: { label: 'কার্ট থেকে সরানো', color: 'bg-orange-100 text-orange-800', icon: Trash2 },
  purchase: { label: 'ক্রয়', color: 'bg-green-100 text-green-800', icon: CreditCard },
  view_product: { label: 'প্রোডাক্ট দেখা', color: 'bg-purple-100 text-purple-800', icon: Eye },
  initiate_checkout: { label: 'চেকআউট শুরু', color: 'bg-yellow-100 text-yellow-800', icon: ShoppingCart },
};

const PAGE_SIZE = 50;

export default function AdminActivityPage() {
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customer-events', filter, page],
    queryFn: async () => {
      let query = supabase
        .from('customer_events')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (filter !== 'all') {
        query = query.eq('event_type', filter);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { events: data, total: count || 0 };
    },
  });

  const events = data?.events || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const getEventInfo = (type: string) => EVENT_LABELS[type] || { label: type, color: 'bg-muted text-muted-foreground', icon: Activity };

  return (
    <div>
      <div className="py-3 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6" />
              কাস্টমার অ্যাক্টিভিটি
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              মোট ইভেন্ট: {total}
            </p>
          </div>
          <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="ফিল্টার" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব ইভেন্ট</SelectItem>
              <SelectItem value="view_product">প্রোডাক্ট দেখা</SelectItem>
              <SelectItem value="add_to_cart">কার্টে যোগ</SelectItem>
              <SelectItem value="remove_from_cart">কার্ট থেকে সরানো</SelectItem>
              <SelectItem value="initiate_checkout">চেকআউট শুরু</SelectItem>
              <SelectItem value="purchase">ক্রয়</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : !events.length ? (
        <div className="text-center py-12 text-muted-foreground">
          কোনো ইভেন্ট পাওয়া যায়নি
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ইভেন্ট</TableHead>
                  <TableHead>প্রোডাক্ট</TableHead>
                  <TableHead>সাইজ</TableHead>
                  <TableHead>পরিমাণ</TableHead>
                  <TableHead>মূল্য</TableHead>
                  <TableHead>কাস্টমার</TableHead>
                  <TableHead>তারিখ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((e: any) => {
                  const info = getEventInfo(e.event_type);
                  const Icon = info.icon;
                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        <Badge variant="outline" className={`${info.color} border-0 gap-1`}>
                          <Icon className="h-3 w-3" />
                          {info.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate font-medium text-sm">
                        {e.product_title || '—'}
                      </TableCell>
                      <TableCell className="text-sm">{e.product_size || '—'}</TableCell>
                      <TableCell className="text-sm">{e.quantity || '—'}</TableCell>
                      <TableCell className="text-sm">
                        {e.product_price ? `৳${e.product_price}` : '—'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {e.customer_name || e.customer_phone || <span className="text-muted-foreground italic">Guest</span>}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {format(new Date(e.created_at), 'dd MMM yyyy, hh:mm a')}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">
                পেজ {page + 1} / {totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
