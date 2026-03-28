import { SettingsPageWrapper } from './SettingsPageWrapper';
import { useSettingsData } from './useSettingsData';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, Star, Shield, Megaphone, Plus, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const sections = [
  { key: 'show_announcement_bar', label: '📢 Announcement Bar', desc: 'হেডারের উপরে স্ক্রলিং নোটিশ বার', icon: Megaphone },
  { key: 'show_trust_badges', label: '🛡️ Trust Badges', desc: 'Authentic Products, Cash on Delivery, Fast Delivery, Secure Payment', icon: Shield },
  { key: 'show_customer_reviews', label: '⭐ Customer Reviews', desc: 'কাস্টমার রিভিউ ক্যারোসেল সেকশন', icon: Star },
];

export default function HomepageSectionsSettings() {
  const { values, setValues, saveMutation } = useSettingsData();
  const queryClient = useQueryClient();

  const toggle = (key: string) => {
    const current = values[key] !== 'false';
    setValues((prev) => ({ ...prev, [key]: current ? 'false' : 'true' }));
  };

  // Announcement items management
  const { data: announcementItems, isLoading: loadingItems } = useQuery({
    queryKey: ['admin-announcement-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcement_items')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const [items, setItems] = useState<{ id?: string; content: string; content_bn: string; is_active: boolean; sort_order: number }[]>([]);

  useEffect(() => {
    if (announcementItems) {
      setItems(announcementItems.map(i => ({
        id: i.id,
        content: i.content,
        content_bn: i.content_bn || '',
        is_active: i.is_active,
        sort_order: i.sort_order ?? 0,
      })));
    }
  }, [announcementItems]);

  const addItem = () => {
    setItems(prev => [...prev, { content: '', content_bn: '', is_active: true, sort_order: prev.length }]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string | boolean) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const saveAnnouncementsMutation = useMutation({
    mutationFn: async () => {
      // Delete all existing
      const { error: delErr } = await supabase.from('announcement_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (delErr) throw delErr;
      // Insert all current
      if (items.length > 0) {
        const rows = items.map((item, i) => ({
          content: item.content,
          content_bn: item.content_bn || null,
          is_active: item.is_active,
          sort_order: i,
        }));
        const { error } = await supabase.from('announcement_items').insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcement-items'] });
      queryClient.invalidateQueries({ queryKey: ['announcement-items'] });
      toast.success('নোটিশ আপডেট হয়েছে');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSaveAll = async () => {
    await saveAnnouncementsMutation.mutateAsync();
    saveMutation.mutate();
  };

  return (
    <SettingsPageWrapper
      title="হোমপেজ সেকশন"
      onSave={handleSaveAll}
      isSaving={saveMutation.isPending || saveAnnouncementsMutation.isPending}
    >
      <div className="space-y-3">
        {sections.map((s) => {
          const isOn = values[s.key] !== 'false';
          return (
            <div
              key={s.key}
              className="flex items-center justify-between gap-4 bg-card border rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <Label className="font-semibold text-sm cursor-pointer">{s.label}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
              </div>
              <Switch checked={isOn} onCheckedChange={() => toggle(s.key)} />
            </div>
          );
        })}
      </div>

      {/* Announcement Items Editor */}
      {values['show_announcement_bar'] !== 'false' && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="font-semibold text-base">📢 নোটিশ টেক্সট সমূহ</Label>
            <Button size="sm" variant="outline" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" /> নতুন যোগ করুন
            </Button>
          </div>
          {items.map((item, index) => (
            <div key={index} className="bg-card border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">নোটিশ #{index + 1}</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={(v) => updateItem(index, 'is_active', v)}
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeItem(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1 block">English Text</Label>
                <Input
                  value={item.content}
                  onChange={(e) => updateItem(index, 'content', e.target.value)}
                  placeholder="Enter announcement text..."
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">বাংলা টেক্সট</Label>
                <Input
                  value={item.content_bn}
                  onChange={(e) => updateItem(index, 'content_bn', e.target.value)}
                  placeholder="বাংলায় নোটিশ লিখুন..."
                />
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">কোনো নোটিশ নেই। "নতুন যোগ করুন" বাটনে ক্লিক করুন।</p>
          )}
        </div>
      )}
    </SettingsPageWrapper>
  );
}
