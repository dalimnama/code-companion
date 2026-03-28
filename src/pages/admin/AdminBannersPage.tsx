import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Save, X, GripVertical } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Tables } from '@/integrations/supabase/types';

type Banner = Tables<'banners'>;

const emptyBanner = {
  title: '',
  subtitle: '',
  image: '',
  link: '',
  cta_text: '',
  cta_text_bn: '',
  is_active: true,
  sort_order: 0,
};

export default function AdminBannersPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState(emptyBanner);

  const { data: banners, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const { data } = await supabase.from('banners').select('*').order('sort_order');
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.title || !form.image) throw new Error('টাইটেল ও ইমেজ আবশ্যক');
      if (editing) {
        const { error } = await supabase.from('banners').update(form).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('banners').insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success(editing ? 'ব্যানার আপডেট হয়েছে' : 'ব্যানার যোগ হয়েছে');
      closeDialog();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success('ব্যানার ডিলেট হয়েছে');
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('banners').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyBanner, sort_order: (banners?.length || 0) + 1 });
    setDialogOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({
      title: b.title,
      subtitle: b.subtitle || '',
      image: b.image,
      link: b.link || '',
      cta_text: b.cta_text || '',
      cta_text_bn: b.cta_text_bn || '',
      is_active: b.is_active ?? true,
      sort_order: b.sort_order ?? 0,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyBanner);
  };

  if (isLoading) return <div className="text-center py-10 text-muted-foreground">লোড হচ্ছে...</div>;

  return (
    <div className="space-y-6">
      <AdminPageHeader>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">ব্যানার ম্যানেজমেন্ট</h1>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> নতুন ব্যানার</Button>
        </div>
      </AdminPageHeader>

      {/* Banner list */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ক্রম</TableHead>
              <TableHead className="w-20">ছবি</TableHead>
              <TableHead>টাইটেল</TableHead>
              <TableHead className="w-24">লিঙ্ক</TableHead>
              <TableHead className="w-20">সক্রিয়</TableHead>
              <TableHead className="w-24 text-right">অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banners?.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="text-muted-foreground">{b.sort_order}</TableCell>
                <TableCell>
                  <img src={b.image} alt={b.title} className="w-16 h-10 object-cover rounded" />
                </TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{b.title}</div>
                  {b.subtitle && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{b.subtitle}</div>}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground truncate max-w-[100px]">{b.link || '—'}</TableCell>
                <TableCell>
                  <Switch
                    checked={b.is_active ?? true}
                    onCheckedChange={(checked) => toggleActive.mutate({ id: b.id, is_active: checked })}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm('এই ব্যানারটি ডিলেট করতে চান?')) deleteMutation.mutate(b.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!banners?.length && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">কোনো ব্যানার নেই</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'ব্যানার এডিট' : 'নতুন ব্যানার'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>টাইটেল *</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="ব্যানার টাইটেল" />
            </div>
            <div className="space-y-1.5">
              <Label>সাবটাইটেল</Label>
              <Input value={form.subtitle} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} placeholder="ছোট বর্ণনা" />
            </div>
            <div className="space-y-1.5">
              <Label>ইমেজ URL *</Label>
              <Input value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))} placeholder="https://..." />
              {form.image && <img src={form.image} alt="Preview" className="w-full h-32 object-cover rounded-lg mt-2" />}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>লিঙ্ক</Label>
                <Input value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))} placeholder="/p/product-slug" />
              </div>
              <div className="space-y-1.5">
                <Label>ক্রম</Label>
                <Input type="number" value={form.sort_order ?? ''} onChange={e => setForm(p => ({ ...p, sort_order: e.target.value === '' ? null : Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>CTA টেক্সট (EN)</Label>
                <Input value={form.cta_text} onChange={e => setForm(p => ({ ...p, cta_text: e.target.value }))} placeholder="Shop Now" />
              </div>
              <div className="space-y-1.5">
                <Label>CTA টেক্সট (বাংলা)</Label>
                <Input value={form.cta_text_bn} onChange={e => setForm(p => ({ ...p, cta_text_bn: e.target.value }))} placeholder="কিনুন" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={checked => setForm(p => ({ ...p, is_active: checked }))} />
              <Label>সক্রিয়</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeDialog}><X className="h-4 w-4 mr-1" /> বাতিল</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                <Save className="h-4 w-4 mr-1" /> {saveMutation.isPending ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
