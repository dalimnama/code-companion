import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();

  // --- Categories ---
  const [catEditing, setCatEditing] = useState<any>(null);
  const [catIsNew, setCatIsNew] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => { const { data } = await supabase.from('categories').select('*').order('sort_order'); return data || []; },
  });

  const saveCat = useMutation({
    mutationFn: async (cat: any) => {
      if (catIsNew) {
        const { error } = await supabase.from('categories').insert(cat);
        if (error) throw error;
      } else {
        const { id, ...rest } = cat;
        const { error } = await supabase.from('categories').update(rest).eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-categories'] }); toast.success('সেভ হয়েছে'); setCatEditing(null); },
    onError: (e) => toast.error(e.message),
  });

  const deleteCat = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('categories').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-categories'] }); toast.success('ডিলিট হয়েছে'); },
  });

  // --- Brands ---
  const [brandEditing, setBrandEditing] = useState<any>(null);
  const [brandIsNew, setBrandIsNew] = useState(false);

  const { data: brands } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: async () => { const { data } = await supabase.from('brands').select('*').order('name'); return data || []; },
  });

  const saveBrand = useMutation({
    mutationFn: async (brand: any) => {
      if (brandIsNew) {
        const { error } = await supabase.from('brands').insert(brand);
        if (error) throw error;
      } else {
        const { id, ...rest } = brand;
        const { error } = await supabase.from('brands').update(rest).eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-brands'] }); toast.success('সেভ হয়েছে'); setBrandEditing(null); },
    onError: (e) => toast.error(e.message),
  });

  const deleteBrand = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('brands').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-brands'] }); toast.success('ডিলিট হয়েছে'); },
  });

  return (
    <div className="space-y-4">
      <AdminPageHeader>
        <h1 className="text-2xl font-bold">ক্যাটাগরি ও ব্র্যান্ড</h1>
      </AdminPageHeader>

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">ক্যাটাগরি</TabsTrigger>
          <TabsTrigger value="brands">ব্র্যান্ড</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setCatEditing({ name: '', name_bn: '', slug: '', image: '', is_active: true, sort_order: 0 }); setCatIsNew(true); }}>
              <Plus className="h-4 w-4 mr-2" /> নতুন ক্যাটাগরি
            </Button>
          </div>
          <div className="bg-card border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50 text-left">
                <th className="p-3 font-medium">নাম</th><th className="p-3 font-medium">নাম (বাংলা)</th><th className="p-3 font-medium">সক্রিয়</th><th className="p-3 font-medium">অ্যাকশন</th>
              </tr></thead>
              <tbody>
                {categories?.map(c => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3">{c.name}</td>
                    <td className="p-3">{c.name_bn}</td>
                    <td className="p-3">{c.is_active ? '✅' : '❌'}</td>
                    <td className="p-3 flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setCatEditing(c); setCatIsNew(false); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm('ডিলিট?')) deleteCat.mutate(c.id); }}><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="brands" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setBrandEditing({ name: '', slug: '', logo: '' }); setBrandIsNew(true); }}>
              <Plus className="h-4 w-4 mr-2" /> নতুন ব্র্যান্ড
            </Button>
          </div>
          <div className="bg-card border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50 text-left">
                <th className="p-3 font-medium">নাম</th><th className="p-3 font-medium">Slug</th><th className="p-3 font-medium">অ্যাকশন</th>
              </tr></thead>
              <tbody>
                {brands?.map(b => (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3">{b.name}</td>
                    <td className="p-3">{b.slug}</td>
                    <td className="p-3 flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setBrandEditing(b); setBrandIsNew(false); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm('ডিলিট?')) deleteBrand.mutate(b.id); }}><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={!!catEditing} onOpenChange={() => setCatEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{catIsNew ? 'নতুন ক্যাটাগরি' : 'ক্যাটাগরি এডিট'}</DialogTitle></DialogHeader>
          {catEditing && (
            <form onSubmit={e => { e.preventDefault(); saveCat.mutate(catEditing); }} className="space-y-3">
              <div className="space-y-2"><Label>নাম (English)</Label><Input value={catEditing.name} onChange={e => setCatEditing({ ...catEditing, name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>নাম (বাংলা)</Label><Input value={catEditing.name_bn} onChange={e => setCatEditing({ ...catEditing, name_bn: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Slug</Label><Input value={catEditing.slug} onChange={e => setCatEditing({ ...catEditing, slug: e.target.value })} required /></div>
              <div className="space-y-2"><Label>ইমেজ URL</Label><Input value={catEditing.image || ''} onChange={e => setCatEditing({ ...catEditing, image: e.target.value })} /></div>
              <div className="space-y-2"><Label>সর্ট অর্ডার</Label><Input type="number" value={catEditing.sort_order ?? ''} onChange={e => setCatEditing({ ...catEditing, sort_order: e.target.value === '' ? null : Number(e.target.value) })} /></div>
              <label className="flex items-center gap-2 text-sm"><Switch checked={catEditing.is_active} onCheckedChange={v => setCatEditing({ ...catEditing, is_active: v })} /> সক্রিয়</label>
              <Button type="submit" className="w-full" disabled={saveCat.isPending}>সেভ করুন</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Brand Dialog */}
      <Dialog open={!!brandEditing} onOpenChange={() => setBrandEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{brandIsNew ? 'নতুন ব্র্যান্ড' : 'ব্র্যান্ড এডিট'}</DialogTitle></DialogHeader>
          {brandEditing && (
            <form onSubmit={e => { e.preventDefault(); saveBrand.mutate(brandEditing); }} className="space-y-3">
              <div className="space-y-2"><Label>নাম</Label><Input value={brandEditing.name} onChange={e => setBrandEditing({ ...brandEditing, name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Slug</Label><Input value={brandEditing.slug} onChange={e => setBrandEditing({ ...brandEditing, slug: e.target.value })} required /></div>
              <div className="space-y-2"><Label>লোগো URL</Label><Input value={brandEditing.logo || ''} onChange={e => setBrandEditing({ ...brandEditing, logo: e.target.value })} /></div>
              <Button type="submit" className="w-full" disabled={saveBrand.isPending}>সেভ করুন</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
