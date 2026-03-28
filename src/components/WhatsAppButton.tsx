import { MessageCircle } from 'lucide-react';
import { useSiteSettings } from '@/hooks/use-site-settings';

export function WhatsAppButton() {
  const { data: settings } = useSiteSettings();
  const whatsapp = settings?.whatsapp || '8801840469120';

  return (
    <a
      href={`https://wa.me/${whatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 md:bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[hsl(142,70%,45%)] text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all max-md:bottom-[72px]"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
