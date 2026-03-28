import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useSettingsData() {
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

      // Update changed existing settings
      const changed = (settings || []).filter(
        s => typeof values[s.key] !== 'undefined' && values[s.key] !== s.value
      );
      const updateResults = await Promise.all(
        changed.map(s =>
          supabase.from('site_settings').update({ value: values[s.key], updated_at: now }).eq('id', s.id)
        )
      );
      const failed = updateResults.find(r => r.error);
      if (failed?.error) throw failed.error;

      // Insert any new keys not in DB
      const newKeys = Object.keys(values).filter(k => !existingByKey.has(k));
      if (newKeys.length > 0) {
        const rows = newKeys.map(k => ({
          key: k,
          value: values[k],
          category: 'general',
          label: k,
          updated_at: now,
        }));
        const { error } = await supabase.from('site_settings').insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('সেটিংস সেভ হয়েছে');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { values, setValues, settings, isLoading, saveMutation };
}

export function toNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
