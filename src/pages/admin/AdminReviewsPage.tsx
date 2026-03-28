import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Star, Check, X, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useState } from 'react';

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*, products(title)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase
        .from('product_reviews')
        .update({ is_approved: approved })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('আপডেট হয়েছে');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_reviews').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('ডিলিট হয়েছে');
    },
  });

  const filtered = reviews?.filter((r) => {
    if (filter === 'pending') return !r.is_approved;
    if (filter === 'approved') return r.is_approved;
    return true;
  });

  const pendingCount = reviews?.filter((r) => !r.is_approved).length || 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">কাস্টমার রিভিউ</h1>
          {pendingCount > 0 && (
            <Badge variant="destructive">{pendingCount} পেন্ডিং</Badge>
          )}
        </div>
      </AdminPageHeader>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'all' ? 'সকল' : f === 'pending' ? 'পেন্ডিং' : 'অ্যাপ্রুভড'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm text-center py-10">লোড হচ্ছে...</p>
      ) : !filtered?.length ? (
        <p className="text-muted-foreground text-sm text-center py-10">কোনো রিভিউ নেই</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="bg-card border rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{r.customer_name}</span>
                    {r.customer_phone && (
                      <span className="text-xs text-muted-foreground">{r.customer_phone}</span>
                    )}
                    <Badge variant={r.is_approved ? 'default' : 'secondary'} className="text-[10px]">
                      {r.is_approved ? 'অ্যাপ্রুভড' : 'পেন্ডিং'}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {(r as any).products?.title} • {new Date(r.created_at).toLocaleDateString('bn-BD')}
                  </p>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-3 w-3 ${s <= r.rating ? 'fill-warning text-warning' : 'text-muted-foreground/20'}`} />
                  ))}
                </div>
              </div>

              <p className="text-sm text-muted-foreground">{r.review_text}</p>

              <div className="flex gap-2 pt-1">
                {!r.is_approved && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 text-primary border-primary/30"
                    onClick={() => updateMutation.mutate({ id: r.id, approved: true })}
                    disabled={updateMutation.isPending}
                  >
                    <Check className="h-3 w-3" /> অ্যাপ্রুভ
                  </Button>
                )}
                {r.is_approved && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => updateMutation.mutate({ id: r.id, approved: false })}
                    disabled={updateMutation.isPending}
                  >
                    <X className="h-3 w-3" /> রিজেক্ট
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                  onClick={() => deleteMutation.mutate(r.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3 w-3" /> ডিলিট
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
