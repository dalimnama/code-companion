import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatBDT } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const PANT_SIZES = ['30', '32', '34', '36', '38'];

const parseNumberInput = (value: string): number | undefined => {
  if (value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

type Product = {
  id: string;
  title: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  is_active: boolean;
  is_featured: boolean | null;
  is_new: boolean | null;
  is_flash_sale: boolean | null;
  is_super: boolean | null;
  is_mega: boolean | null;
  flash_sale_end: string | null;
  category_id: string | null;
  brand_id: string | null;
  images: string[] | null;
  short_description: string | null;
  description: string | null;
  rating_avg: number | null;
  rating_count: number | null;
  specifications: Record<string, string> | null;
  has_sizes: boolean;
  size_stock: Record<string, number> | null;
  has_pant_sizes: boolean;
  pant_size_stock: Record<string, number> | null;
  has_size_chart: boolean;
  size_chart_type: string | null;
};

const emptyProduct: Partial<Product> = {
  title: '', slug: '', price: 0, compare_at_price: null, stock: 0,
  is_active: true, is_featured: false, is_new: false, is_flash_sale: false, is_super: false, is_mega: false,
  category_id: null, brand_id: null, images: [], short_description: '', description: '', specifications: {},
  has_sizes: false, size_stock: {}, has_pant_sizes: false, pant_size_stock: {}, has_size_chart: false, size_chart_type: null,
};

export default function AdminProductsPage() {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      return (data || []) as Product[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['admin-categories-list'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('id, name');
      return data || [];
    },
  });

  const { data: brands } = useQuery({
    queryKey: ['admin-brands-list'],
    queryFn: async () => {
      const { data } = await supabase.from('brands').select('id, name');
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (product: Partial<Product>) => {
      // Clean up images - trim and filter empty strings
      const payload: Partial<Product> = {
        ...product,
        images: (product.images || []).map(s => s.trim()).filter(Boolean),
        price: product.price ?? 0,
        stock: product.stock ?? 0,
        rating_avg: product.rating_avg ?? null,
        rating_count: product.rating_count ?? null,
      };
      if (payload.has_sizes && payload.size_stock) {
        payload.stock = Object.values(payload.size_stock).reduce((sum, v) => sum + (v || 0), 0);
      } else if (payload.has_pant_sizes && payload.pant_size_stock) {
        payload.stock = Object.values(payload.pant_size_stock).reduce((sum, v) => sum + (v || 0), 0);
      }
      if (isNew) {
        const { error } = await supabase.from('products').insert(payload as any);
        if (error) throw error;
      } else {
        const { id, ...rest } = payload;
        const { error } = await supabase.from('products').update(rest as any).eq('id', id!);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(isNew ? 'প্রোডাক্ট তৈরি হয়েছে' : 'প্রোডাক্ট আপডেট হয়েছে');
      setEditing(null);
    },
    onError: (e) => toast.error(`ত্রুটি: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('প্রোডাক্ট ডিলিট হয়েছে');
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('products').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const filtered = products?.filter(p => p.title.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <div className="space-y-4">
      <AdminPageHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold">প্রোডাক্ট ম্যানেজমেন্ট</h1>
          <Button onClick={() => { setEditing({ ...emptyProduct }); setIsNew(true); }}>
            <Plus className="h-4 w-4 mr-2" /> নতুন প্রোডাক্ট
          </Button>
        </div>
      </AdminPageHeader>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="প্রোডাক্ট খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="p-3 font-medium">প্রোডাক্ট</th>
                <th className="p-3 font-medium">দাম</th>
                <th className="p-3 font-medium hidden md:table-cell">স্টক</th>
                <th className="p-3 font-medium">সক্রিয়</th>
                <th className="p-3 font-medium">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">লোড হচ্ছে...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">কোনো প্রোডাক্ট নেই</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {p.images?.[0] && <img src={p.images[0]} alt="" className="w-10 h-10 rounded object-cover" />}
                      <span className="font-medium truncate max-w-[200px]">{p.title}</span>
                    </div>
                  </td>
                  <td className="p-3">{formatBDT(p.price)}</td>
                  <td className="p-3 hidden md:table-cell">
                    {p.has_sizes ? (
                      <span className="text-xs">
                        {SIZES.map(s => `${s}:${(p.size_stock as any)?.[s] || 0}`).join(' ')}
                      </span>
                    ) : (p as any).has_pant_sizes ? (
                      <span className="text-xs">
                        {PANT_SIZES.map(s => `${s}:${((p as any).pant_size_stock as any)?.[s] || 0}`).join(' ')}
                      </span>
                    ) : p.stock}
                  </td>
                  <td className="p-3">
                    <Switch checked={p.is_active} onCheckedChange={(val) => toggleActive.mutate({ id: p.id, is_active: val })} />
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setIsNew(false); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm('ডিলিট করতে চান?')) deleteMutation.mutate(p.id); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? 'নতুন প্রোডাক্ট' : 'প্রোডাক্ট এডিট'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(editing); }} className="space-y-4">
              <div className="space-y-2">
                <Label>টাইটেল</Label>
                <Input value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={editing.slug || ''} onChange={e => setEditing({ ...editing, slug: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>দাম (৳)</Label>
                  <Input type="number" value={editing.price ?? ''} onChange={e => setEditing({ ...editing, price: parseNumberInput(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>আগের দাম (৳)</Label>
                  <Input type="number" value={editing.compare_at_price ?? ''} onChange={e => setEditing({ ...editing, compare_at_price: parseNumberInput(e.target.value) ?? null })} />
                </div>
              </div>

              {/* Size System Toggle */}
              <div className="border rounded-xl p-4 space-y-3 bg-muted/30">
                <label className="flex items-center justify-between">
                  <span className="font-medium text-sm">সাইজ সিস্টেম (S, M, L, XL, XXL)</span>
                  <Switch checked={editing.has_sizes ?? false} onCheckedChange={v => setEditing({ ...editing, has_sizes: v, has_pant_sizes: v ? false : editing.has_pant_sizes })} />
                </label>
                {editing.has_sizes && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">প্রতিটি সাইজে স্টক সংখ্যা দিন</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {SIZES.map(size => (
                        <div key={size} className="space-y-1">
                          <Label className="text-xs text-center block">{size}</Label>
                          <Input
                            type="number"
                            min={0}
                            value={(editing.size_stock as any)?.[size] ?? ''}
                            onChange={e => {
                              const ss = { ...(editing.size_stock || {}) } as Record<string, number>;
                              const nextValue = parseNumberInput(e.target.value);
                              if (nextValue === undefined) {
                                delete ss[size];
                              } else {
                                ss[size] = nextValue;
                              }
                              setEditing({ ...editing, size_stock: ss });
                            }}
                            className="h-9 text-center text-sm"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      মোট স্টক: {SIZES.reduce((s, sz) => s + ((editing.size_stock as any)?.[sz] || 0), 0)}
                    </p>
                  </div>
                )}
              </div>

              {/* Regular stock (only when no size system) */}
              {!editing.has_sizes && !editing.has_pant_sizes && (
                <div className="space-y-2">
                  <Label>স্টক</Label>
                  <Input type="number" value={editing.stock ?? ''} onChange={e => setEditing({ ...editing, stock: parseNumberInput(e.target.value) })} />
                </div>
              )}

              {/* Pant Size System Toggle */}
              <div className="border rounded-xl p-4 space-y-3 bg-muted/30">
                <label className="flex items-center justify-between">
                  <span className="font-medium text-sm">প্যান্ট সাইজ সিস্টেম (30, 32, 34, 36, 38)</span>
                  <Switch checked={editing.has_pant_sizes ?? false} onCheckedChange={v => setEditing({ ...editing, has_pant_sizes: v, has_sizes: v ? false : editing.has_sizes })} />
                </label>
                {editing.has_pant_sizes && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">প্রতিটি সাইজে স্টক সংখ্যা দিন</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {PANT_SIZES.map(size => (
                        <div key={size} className="space-y-1">
                          <Label className="text-xs text-center block">{size}</Label>
                          <Input
                            type="number"
                            min={0}
                            value={(editing.pant_size_stock as any)?.[size] ?? ''}
                            onChange={e => {
                              const ps = { ...(editing.pant_size_stock || {}) } as Record<string, number>;
                              const nextValue = parseNumberInput(e.target.value);
                              if (nextValue === undefined) {
                                delete ps[size];
                              } else {
                                ps[size] = nextValue;
                              }
                              setEditing({ ...editing, pant_size_stock: ps });
                            }}
                            className="h-9 text-center text-sm"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      মোট স্টক: {PANT_SIZES.reduce((s, sz) => s + ((editing.pant_size_stock as any)?.[sz] || 0), 0)}
                    </p>
                  </div>
                )}
              </div>

              {/* Size Chart Toggle */}
              <div className="border rounded-xl p-4 space-y-3 bg-muted/30">
                <label className="flex items-center justify-between">
                  <span className="font-medium text-sm">সাইজ চার্ট দেখান</span>
                  <Switch checked={editing.has_size_chart ?? false} onCheckedChange={v => setEditing({ ...editing, has_size_chart: v })} />
                </label>
                {editing.has_size_chart && (
                  <div className="space-y-2">
                    <Label className="text-xs">সাইজ চার্ট টাইপ</Label>
                    <Select value={editing.size_chart_type || 'shirt'} onValueChange={v => setEditing({ ...editing, size_chart_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shirt">Shirt Chart</SelectItem>
                        <SelectItem value="pant">Pant Chart</SelectItem>
                        <SelectItem value="panjabi">Panjabi Chart</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>ক্যাটাগরি</Label>
                  <Select value={editing.category_id || 'none'} onValueChange={v => setEditing({ ...editing, category_id: v === 'none' ? null : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">নির্বাচন করুন</SelectItem>
                      {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ব্র্যান্ড</Label>
                  <Select value={editing.brand_id || 'none'} onValueChange={v => setEditing({ ...editing, brand_id: v === 'none' ? null : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">নির্বাচন করুন</SelectItem>
                      {brands?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>ইমেজ URLs (কমা দিয়ে আলাদা)</Label>
                <Textarea value={editing.images?.join(',') || ''} onChange={e => setEditing({ ...editing, images: e.target.value.split(',') })} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>সংক্ষিপ্ত বিবরণ</Label>
                <Textarea value={editing.short_description || ''} onChange={e => setEditing({ ...editing, short_description: e.target.value })} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>বিস্তারিত বিবরণ</Label>
                <Textarea value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>রেটিং (০-৫)</Label>
                  <Input type="number" step="0.1" min="0" max="5" value={editing.rating_avg ?? ''} onChange={e => setEditing({ ...editing, rating_avg: parseNumberInput(e.target.value) ?? null })} />
                </div>
                <div className="space-y-2">
                  <Label>রেটিং সংখ্যা</Label>
                  <Input type="number" min="0" value={editing.rating_count ?? ''} onChange={e => setEditing({ ...editing, rating_count: parseNumberInput(e.target.value) ?? null })} />
                </div>
              </div>
              {/* Specifications Editor */}
              <div className="space-y-2">
                <Label>স্পেসিফিকেশন (Key-Value)</Label>
                <div className="space-y-2">
                  {Object.entries(editing.specifications || {}).map(([key, value], idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input
                        placeholder="Key (যেমন: Material)"
                        value={key}
                        onChange={e => {
                          const specs = { ...editing.specifications } as Record<string, string>;
                          const val = specs[key];
                          delete specs[key];
                          specs[e.target.value] = val;
                          setEditing({ ...editing, specifications: specs });
                        }}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Value (যেমন: Cotton)"
                        value={value as string}
                        onChange={e => {
                          const specs = { ...editing.specifications } as Record<string, string>;
                          specs[key] = e.target.value;
                          setEditing({ ...editing, specifications: specs });
                        }}
                        className="flex-1"
                      />
                      <Button type="button" variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => {
                        const specs = { ...editing.specifications } as Record<string, string>;
                        delete specs[key];
                        setEditing({ ...editing, specifications: specs });
                      }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    const specs = { ...editing.specifications } as Record<string, string>;
                    specs[''] = '';
                    setEditing({ ...editing, specifications: specs });
                  }}>
                    <Plus className="h-4 w-4 mr-1" /> স্পেসিফিকেশন যোগ করুন
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={editing.is_active ?? true} onCheckedChange={v => setEditing({ ...editing, is_active: v })} /> সক্রিয়
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={editing.is_featured ?? false} onCheckedChange={v => setEditing({ ...editing, is_featured: v })} /> ফিচার্ড
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={editing.is_new ?? false} onCheckedChange={v => setEditing({ ...editing, is_new: v })} /> নতুন
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={editing.is_flash_sale ?? false} onCheckedChange={v => setEditing({ ...editing, is_flash_sale: v, flash_sale_end: v ? (editing.flash_sale_end || '') : null })} /> ফ্ল্যাশ সেল
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={editing.is_super ?? false} onCheckedChange={v => setEditing({ ...editing, is_super: v })} /> সুপার
                </label>
              </div>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={editing.is_mega ?? false} onCheckedChange={v => setEditing({ ...editing, is_mega: v })} /> মেগা
                </label>
              {editing.is_flash_sale && (
                <div className="space-y-2">
                  <Label>ফ্ল্যাশ সেল শেষ হওয়ার সময়</Label>
                  <Input
                    type="datetime-local"
                    value={editing.flash_sale_end ? new Date(editing.flash_sale_end).toISOString().slice(0, 16) : ''}
                    onChange={e => setEditing({ ...editing, flash_sale_end: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  />
                  {editing.flash_sale_end && (
                    <p className="text-xs text-muted-foreground">
                      শেষ: {new Date(editing.flash_sale_end).toLocaleString('bn-BD')}
                    </p>
                  )}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
