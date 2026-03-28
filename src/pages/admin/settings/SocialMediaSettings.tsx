import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SettingsPageWrapper } from './SettingsPageWrapper';
import { Facebook, Instagram, Twitter, Youtube, Globe } from 'lucide-react';

const socialFields = [
  { key: 'facebook_url', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/yourpage' },
  { key: 'instagram_url', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/yourpage' },
  { key: 'twitter_url', label: 'Twitter / X', icon: Twitter, placeholder: 'https://x.com/yourhandle' },
  { key: 'youtube_url', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@yourchannel' },
  { key: 'tiktok_url', label: 'TikTok', icon: Globe, placeholder: 'https://tiktok.com/@yourpage' },
  { key: 'whatsapp_channel_url', label: 'WhatsApp Channel', icon: Globe, placeholder: 'https://whatsapp.com/channel/...' },
];

export default function SocialMediaSettings() {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-site-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('*').order('category');
      return data || [];
    },
  });

  useEffect(() => {
    if (settings) {
      const map: Record<string, string> = {};
      settings.forEach(s => { map[s.key] = s.value; });
      setValues(map);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      const existingByKey = new Map((settings || []).map(s => [s.key, s]));

      for (const field of socialFields) {
        const val = values[field.key] || '';
        const existing = existingByKey.get(field.key);
        if (existing) {
          if (existing.value !== val) {
            const { error } = await supabase.from('site_settings').update({ value: val, updated_at: now }).eq('id', existing.id);
            if (error) throw error;
          }
        } else {
          const { error } = await supabase.from('site_settings').insert({
            key: field.key,
            value: val,
            category: 'social',
            label: field.label,
            updated_at: now,
          });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('সোশ্যাল মিডিয়া লিংক সেভ হয়েছে');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-center py-10 text-muted-foreground">লোড হচ্ছে...</div>;

  return (
    <SettingsPageWrapper title="📱 সোশ্যাল মিডিয়া লিংক" onSave={() => saveMutation.mutate()} isSaving={saveMutation.isPending}>
      <div className="bg-card border rounded-xl p-5 space-y-2">
        <p className="text-xs text-muted-foreground mb-4">
          যেই প্ল্যাটফর্মের লিংক দিবেন, শুধু সেই আইকনটাই ওয়েবসাইটের ফুটারে দেখাবে। লিংক খালি রাখলে আইকন লুকানো থাকবে।
        </p>
        <div className="grid gap-4">
          {socialFields.map(field => {
            const Icon = field.icon;
            return (
              <div key={field.key} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">{field.label}</Label>
                  <Input
                    value={values[field.key] || ''}
                    onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SettingsPageWrapper>
  );
}
