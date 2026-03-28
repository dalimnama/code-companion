import { useLanguageStore } from '@/stores/language-store';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useSiteSettings } from '@/hooks/use-site-settings';

export function AnnouncementBar() {
  const { language } = useLanguageStore();
  const { data: settings } = useSiteSettings();
  
  const isEnabled = settings?.show_announcement_bar !== 'false';

  const { data: items } = useQuery({
    queryKey: ['announcement-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcement_items')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 30,
    enabled: isEnabled,
  });

  const [hidden, setHidden] = useState(false);
  const hiddenRef = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const shouldHide = hiddenRef.current ? y > 4 : y > 20;
      if (shouldHide !== hiddenRef.current) {
        hiddenRef.current = shouldHide;
        setHidden(shouldHide);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const text = items?.map(item => {
    const content = language === 'bn' && item.content_bn ? item.content_bn : item.content;
    return content;
  }).join('   ★   ') || '';

  if (!isEnabled || !text) return null;

  return (
    <div
      className={cn(
        "bg-primary text-primary-foreground text-sm font-medium overflow-hidden relative w-full transition-[max-height,padding,opacity] duration-300 ease-out",
        hidden ? "max-h-0 py-0 opacity-0" : "max-h-9 py-2 opacity-100"
      )}
    >
      <div className="announcement-scroll inline-flex whitespace-nowrap">
        <span className="shrink-0 px-12">{text}</span>
        <span className="shrink-0 px-12">{text}</span>
      </div>
    </div>
  );
}
