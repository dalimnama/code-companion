import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Ticket } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import type { Tables } from '@/integrations/supabase/types';

type Coupon = Tables<'coupons'>;

const emptyCoupon = { code: '', type: 'percent', value: 0, min_spend: 0, is_active: true };

export default function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Coupon>>(emptyCoupon);

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Coupon[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code: editing.code!.toUpperCase().trim(),
        type: editing.type || 'percent',
        value: Number(editing.value) || 0,
        min_spend: Number(editing.min_spend) || 0,
        is_active: editing.is_active ?? true,
      };
      if (!payload.code) throw new Error('কুপন কোড দিন');
      if (payload.value <= 0) throw new Error('ভ্যালু ০ এর বেশি হতে হবে');

      if (editing.id) {
        const { error } = await supabase.from('coupons').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('coupons').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success(editing.id ? 'কুপন আপডেট হয়েছে' : 'কুপন তৈরি হয়েছে');
      setOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('কুপন ডিলিট হয়েছে');
    },
    onError: (e) => toast.error(e.message),
  });

  const openNew = () => { setEditing({ ...emptyCoupon }); setOpen(true); };
  const openEdit = (c: Coupon) => { setEditing({ ...c }); setOpen(true); };

  if (isLoading) return <div className="text-center py-10 text-muted-foreground">লোড হচ্ছে...</div>;

  return (
    <div className="space-y-6">
      <AdminPageHeader>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">কুপন ম্যানেজমেন্ট</h1>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> নতুন কুপন</Button>
        </div>
      </AdminPageHeader>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">কোড</th>
                <th className="px-4 py-3 font-medium">টাইপ</th>
                <th className="px-4 py-3 font-medium">ভ্যালু</th>
                <th className="px-4 py-3 font-medium">সর্বনিম্ন খরচ</th>
                <th className="px-4 py-3 font-medium">স্ট্যাটাস</th>
                <th className="px-4 py-3 font-medium text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {coupons?.map(c => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono font-bold">{c.code}</td>
                  <td className="px-4 py-3">{c.type === 'percent' ? 'শতাংশ (%)' : 'টাকা (৳)'}</td>
                  <td className="px-4 py-3">{c.type === 'percent' ? `${c.value}%` : `৳${c.value}`}</td>
                  <td className="px-4 py-3">৳{c.min_spend || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {c.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm('ডিলিট করতে চান?')) deleteMutation.mutate(c.id); }}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
              {!coupons?.length && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">কোনো কুপন নেই</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Ticket className="h-5 w-5" /> {editing.id ? 'কুপন এডিট' : 'নতুন কুপন'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>কুপন কোড</Label>
              <Input value={editing.code || ''} onChange={e => setEditing({ ...editing, code: e.target.value.toUpperCase() })} placeholder="যেমন: SAVE20" className="font-mono" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>টাইপ</Label>
                <Select value={editing.type || 'percent'} onValueChange={v => setEditing({ ...editing, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">শতাংশ (%)</SelectItem>
                    <SelectItem value="fixed">টাকা (৳)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ভ্যালু</Label>
                <Input type="number" value={editing.value ?? ''} onChange={e => setEditing({ ...editing, value: e.target.value === '' ? undefined : Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>সর্বনিম্ন খরচ (৳)</Label>
              <Input type="number" value={editing.min_spend ?? ''} onChange={e => setEditing({ ...editing, min_spend: e.target.value === '' ? undefined : Number(e.target.value) })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={editing.is_active ?? true} onCheckedChange={v => setEditing({ ...editing, is_active: v })} /> সক্রিয়
            </label>
            <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
