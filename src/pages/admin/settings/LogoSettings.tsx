import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Image, Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsData } from './useSettingsData';
import { SettingsPageWrapper } from './SettingsPageWrapper';

export default function LogoSettings() {
  const { values, setValues, isLoading, saveMutation } = useSettingsData();

  const logoType = values.logo_type || 'text';
  const logoText = values.logo_text || '';
  const logoImageUrl = values.logo_image_url || '';
  const logoHeight = parseInt(values.logo_height || '40', 10);

  if (isLoading) return <div className="text-center py-10 text-muted-foreground">লোড হচ্ছে...</div>;

  return (
    <SettingsPageWrapper title="🎨 লোগো" onSave={() => saveMutation.mutate()} isSaving={saveMutation.isPending}>
      <div className="bg-card border rounded-xl p-5 space-y-5">
        {/* Preview */}
        <div className="border rounded-lg p-6 bg-muted/30 flex items-center justify-center min-h-[80px]">
          {logoType === 'image' && logoImageUrl ? (
            <img src={logoImageUrl} alt="Logo preview" className="object-contain" style={{ height: `${logoHeight}px` }} />
          ) : (
            <span className="text-primary logo-font" style={{ fontSize: `${logoHeight}px` }}>{logoText || 'rikapio'}</span>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">লোগোর ধরন</Label>
          <RadioGroup value={logoType} onValueChange={(v) => setValues(prev => ({ ...prev, logo_type: v }))} className="flex gap-3">
            <label className={cn("flex items-center gap-2 border rounded-lg px-4 py-3 cursor-pointer transition-colors flex-1", logoType === 'text' ? 'border-primary bg-primary/5' : 'border-border')}>
              <RadioGroupItem value="text" /><Type className="h-4 w-4" /><span className="text-sm font-medium">টেক্সট</span>
            </label>
            <label className={cn("flex items-center gap-2 border rounded-lg px-4 py-3 cursor-pointer transition-colors flex-1", logoType === 'image' ? 'border-primary bg-primary/5' : 'border-border')}>
              <RadioGroupItem value="image" /><Image className="h-4 w-4" /><span className="text-sm font-medium">ইমেজ</span>
            </label>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">লোগো সাইজ: {logoHeight}px</Label>
          <Slider value={[logoHeight]} onValueChange={([v]) => setValues(prev => ({ ...prev, logo_height: String(v) }))} min={20} max={80} step={2} />
        </div>

        {logoType === 'text' && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">লোগো টেক্সট</Label>
            <Input value={logoText} onChange={e => setValues(prev => ({ ...prev, logo_text: e.target.value }))} placeholder="rikapio" />
          </div>
        )}

        {logoType === 'image' && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">লোগো ইমেজ URL</Label>
            <Input value={logoImageUrl} onChange={e => setValues(prev => ({ ...prev, logo_image_url: e.target.value }))} placeholder="https://example.com/logo.png" />
          </div>
        )}
      </div>
    </SettingsPageWrapper>
  );
}
