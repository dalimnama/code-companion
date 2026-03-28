import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

type SizeChart = {
  id: string;
  type: string;
  name: string;
  columns: string[];
  rows: Record<string, string>[];
  created_at: string;
};

const defaultChartTypes = [
  { value: 'shirt', label: 'Shirt Chart' },
  { value: 'pant', label: 'Pant Chart' },
  { value: 'panjabi', label: 'Panjabi Chart' },
];

const emptyChart: Partial<SizeChart> = {
  type: 'shirt',
  name: '',
  columns: ['Size', 'Chest', 'Length', 'Sleeve', 'Collar'],
  rows: [],
};

export default function AdminSizeChartsPage() {
  const [editing, setEditing] = useState<Partial<SizeChart> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [showNewType, setShowNewType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [customTypes, setCustomTypes] = useState<{ value: string; label: string }[]>([]);
  const queryClient = useQueryClient();

  const { data: charts, isLoading } = useQuery({
    queryKey: ['admin-size-charts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('size_charts')
        .select('*')
        .order('created_at', { ascending: false });
      return (data || []) as SizeChart[];
    },
  });

  // Merge default types + custom types from state + types from existing charts
  const allChartTypes = (() => {
    const types = [...defaultChartTypes];
    const existingValues = new Set(types.map(t => t.value));
    // Add custom types created in this session
    customTypes.forEach(ct => {
      if (!existingValues.has(ct.value)) {
        existingValues.add(ct.value);
        types.push(ct);
      }
    });
    // Add types from existing charts in DB
    (charts || []).forEach(c => {
      if (!existingValues.has(c.type)) {
        existingValues.add(c.type);
        types.push({ value: c.type, label: c.type.charAt(0).toUpperCase() + c.type.slice(1).replace(/-/g, ' ') + ' Chart' });
      }
    });
    return types;
  })();

  const saveMutation = useMutation({
    mutationFn: async (chart: Partial<SizeChart>) => {
      const payload = {
        type: chart.type,
        name: chart.name,
        columns: chart.columns,
        rows: chart.rows,
      };
      if (isNew) {
        const { error } = await supabase.from('size_charts').insert(payload as any);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('size_charts').update(payload as any).eq('id', chart.id!);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-size-charts'] });
      toast.success(isNew ? 'সাইজ চার্ট তৈরি হয়েছে' : 'সাইজ চার্ট আপডেট হয়েছে');
      setEditing(null);
    },
    onError: (e) => toast.error(`ত্রুটি: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('size_charts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-size-charts'] });
      toast.success('সাইজ চার্ট ডিলিট হয়েছে');
    },
  });

  const addRow = () => {
    if (!editing) return;
    const newRow: Record<string, string> = {};
    (editing.columns || []).forEach(col => { newRow[col] = ''; });
    setEditing({ ...editing, rows: [...(editing.rows || []), newRow] });
  };

  const addColumn = () => {
    if (!editing) return;
    const cols = [...(editing.columns || []), ''];
    const rows = (editing.rows || []).map(r => ({ ...r, '': '' }));
    setEditing({ ...editing, columns: cols, rows });
  };

  const updateColumn = (idx: number, newName: string) => {
    if (!editing) return;
    const oldName = editing.columns![idx];
    const cols = [...editing.columns!];
    cols[idx] = newName;
    const rows = (editing.rows || []).map(r => {
      const nr = { ...r };
      if (oldName !== newName) {
        nr[newName] = nr[oldName] || '';
        delete nr[oldName];
      }
      return nr;
    });
    setEditing({ ...editing, columns: cols, rows });
  };

  const removeColumn = (idx: number) => {
    if (!editing) return;
    const colName = editing.columns![idx];
    const cols = editing.columns!.filter((_, i) => i !== idx);
    const rows = (editing.rows || []).map(r => {
      const nr = { ...r };
      delete nr[colName];
      return nr;
    });
    setEditing({ ...editing, columns: cols, rows });
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold">সাইজ চার্ট ম্যানেজমেন্ট</h1>
          <Button onClick={() => { setEditing({ ...emptyChart }); setIsNew(true); }}>
            <Plus className="h-4 w-4 mr-2" /> নতুন সাইজ চার্ট
          </Button>
        </div>
      </AdminPageHeader>

      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-3 font-medium">নাম</th>
              <th className="p-3 font-medium">টাইপ</th>
              <th className="p-3 font-medium">কলাম</th>
              <th className="p-3 font-medium">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">লোড হচ্ছে...</td></tr>
            ) : charts?.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">কোনো সাইজ চার্ট নেই</td></tr>
            ) : charts?.map(c => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3">{allChartTypes.find(t => t.value === c.type)?.label || c.type}</td>
                <td className="p-3 text-muted-foreground text-xs">{c.columns?.join(', ')}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setIsNew(false); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm('ডিলিট করতে চান?')) deleteMutation.mutate(c.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? 'নতুন সাইজ চার্ট' : 'সাইজ চার্ট এডিট'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(editing); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>নাম</Label>
                  <Input value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} required placeholder="Shirt Size Chart" />
                </div>
                <div className="space-y-2">
                  <Label>টাইপ</Label>
                  <Select value={editing.type || 'shirt'} onValueChange={v => setEditing({ ...editing, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {allChartTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {!showNewType ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowNewType(true)}>
                      <Plus className="h-3 w-3 mr-1" /> নতুন টাইপ
                    </Button>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <Input
                        value={newTypeName}
                        onChange={e => setNewTypeName(e.target.value)}
                        placeholder="যেমন: Saree Chart"
                        className="h-8 text-sm"
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 shrink-0"
                        disabled={!newTypeName.trim()}
                        onClick={() => {
                          const name = newTypeName.trim();
                          const slug = name.toLowerCase().replace(/\s+/g, '-');
                          const label = name + ' Chart';
                          setCustomTypes(prev => [...prev, { value: slug, label }]);
                          setEditing({ ...editing, type: slug });
                          setShowNewType(false);
                          setNewTypeName('');
                          toast.success(`"${name}" টাইপ যোগ হয়েছে`);
                        }}
                      >
                        যোগ
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { setShowNewType(false); setNewTypeName(''); }}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Column headers */}
              <div className="space-y-2">
                <Label>কলাম হেডার</Label>
                <div className="flex flex-wrap gap-2">
                  {(editing.columns || []).map((col, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <Input
                        value={col}
                        onChange={e => updateColumn(idx, e.target.value)}
                        className="w-24 h-8 text-xs"
                      />
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeColumn(idx)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" className="h-8" onClick={addColumn}>
                    <Plus className="h-3 w-3 mr-1" /> কলাম
                  </Button>
                </div>
              </div>

              {/* Data rows */}
              <div className="space-y-2">
                <Label>ডাটা রো</Label>
                <div className="overflow-x-auto">
                  <table className="text-xs border rounded">
                    <thead>
                      <tr>
                        {(editing.columns || []).map((col, i) => (
                          <th key={i} className="p-1.5 border-b bg-muted/50 font-medium">{col}</th>
                        ))}
                        <th className="p-1.5 border-b bg-muted/50"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(editing.rows || []).map((row, ri) => (
                        <tr key={ri}>
                          {(editing.columns || []).map((col, ci) => (
                            <td key={ci} className="p-1">
                              <Input
                                value={row[col] || ''}
                                onChange={e => {
                                  const rows = [...(editing.rows || [])];
                                  rows[ri] = { ...rows[ri], [col]: e.target.value };
                                  setEditing({ ...editing, rows });
                                }}
                                className="h-7 text-xs w-16"
                              />
                            </td>
                          ))}
                          <td className="p-1">
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => {
                              const rows = (editing.rows || []).filter((_, i) => i !== ri);
                              setEditing({ ...editing, rows });
                            }}>
                              <X className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addRow}>
                  <Plus className="h-3 w-3 mr-1" /> রো যোগ করুন
                </Button>
              </div>

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
