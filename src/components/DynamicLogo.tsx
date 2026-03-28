import { useSiteSettings } from '@/hooks/use-site-settings';
import { cn } from '@/lib/utils';

interface DynamicLogoProps {
  className?: string;
  textClassName?: string;
  imgClassName?: string;
}

export function DynamicLogo({ className, textClassName = 'text-[22px] md:text-[26px]', imgClassName = 'h-8 md:h-10' }: DynamicLogoProps) {
  const { data: settings, isLoading } = useSiteSettings();

  // Don't render anything until settings load to prevent flash
  if (isLoading) {
    return <div className={cn('h-8', className)} />;
  }

  const logoType = settings?.logo_type || 'text';
  const logoText = settings?.logo_text || 'rikapio';
  const logoImageUrl = settings?.logo_image_url;
  const logoHeight = settings?.logo_height ? `${settings.logo_height}px` : undefined;

  if (logoType === 'image' && logoImageUrl) {
    return (
      <div className={className}>
        <img
          src={logoImageUrl}
          alt={logoText || 'Logo'}
          className={cn('object-contain', imgClassName)}
          style={logoHeight ? { height: logoHeight } : undefined}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <span
        className={cn('text-primary logo-font', textClassName)}
        style={logoHeight ? { fontSize: logoHeight } : undefined}
      >
        {logoText}
      </span>
    </div>
  );
}
