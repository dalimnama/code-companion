import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSiteSettings() {
  const resolved = window.__prefetchResolved?.['site-settings'] ?? undefined;
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach((item) => {
        map[item.key] = item.value;
      });
      return map;
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    initialData: resolved,
  });
}
