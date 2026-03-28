import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Plus } from 'lucide-react';
import { useSettingsData, toNumber } from './useSettingsData';
import { SettingsPageWrapper } from './SettingsPageWrapper';

export default function BottomNavSettings() {
  const { values, setValues, isLoading, saveMutation } = useSettingsData();

  const navHeight = toNumber(values.bottom_nav_height, 56);
  const plusWidth = toNumber(values.bottom_nav_plus_width, 48);
  const plusHeight = toNumber(values.bottom_nav_plus_height, 48);
  const plusIconRatio = toNumber(values.bottom_nav_plus_icon_ratio, 50);
  const plusOffsetY = toNumber(values.bottom_nav_plus_offset_y, -28);
  const iconSize = Math.round((Math.min(plusWidth, plusHeight) * plusIconRatio) / 100);

  const sliders = [
    { key: 'bottom_nav_height', min: 48, max: 96, step: 2, unit: 'px', title: 'নেভিগেশন বার হাইট' },
    { key: 'bottom_nav_plus_width', min: 40, max: 88, step: 2, unit: 'px', title: '+ বাটন উইডথ' },
    { key: 'bottom_nav_plus_height', min: 40, max: 88, step: 2, unit: 'px', title: '+ বাটন হাইট' },
    { key: 'bottom_nav_plus_icon_ratio', min: 35, max: 80, step: 1, unit: '%', title: '+ আইকন রেশিও' },
    { key: 'bottom_nav_plus_offset_y', min: -48, max: 24, step: 1, unit: 'px', title: '+ বাটন উপরে/নিচে' },
  ];

  if (isLoading) return <div className="text-center py-10 text-muted-foreground">লোড হচ্ছে...</div>;

  return (
    <SettingsPageWrapper title="📱 বটম নেভিগেশন" onSave={() => saveMutation.mutate()} isSaving={saveMutation.isPending}>
      <div className="bg-card border rounded-xl p-5 space-y-5">
        {/* Preview */}
        <div className="border rounded-lg p-5 bg-muted/30 space-y-4">
          <div className="relative mx-auto w-full max-w-xs rounded-2xl border border-border/60 bg-background/90 px-3" style={{ height: `${navHeight}px` }}>
            <div className="flex h-full items-end justify-around pb-1.5 text-[10px] text-muted-foreground">
              <span>Home</span><span>Cart</span><span>Profile</span>
            </div>
            <div className="absolute left-1/2 top-0 -translate-x-1/2" style={{ transform: `translateX(-50%) translateY(${plusOffsetY}px)` }}>
              <div className="flex items-center justify-center rounded-full bg-foreground text-background shadow-lg" style={{ width: `${plusWidth}px`, height: `${plusHeight}px` }}>
                <Plus style={{ width: `${iconSize}px`, height: `${iconSize}px` }} strokeWidth={2.5} />
              </div>
            </div>
          </div>
          <div className="text-center text-xs text-muted-foreground">লাইভ প্রিভিউ</div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between border rounded-lg p-4">
            <Label className="text-sm font-medium">বটম নেভিগেশন চালু/বন্ধ</Label>
            <Switch checked={values.bottom_nav_enabled === 'true'} onCheckedChange={(c) => setValues(prev => ({ ...prev, bottom_nav_enabled: c ? 'true' : 'false' }))} />
          </div>
          <div className="flex items-center justify-between border rounded-lg p-4">
            <Label className="text-sm font-medium">স্ক্রলে হাইড করুন</Label>
            <Switch checked={values.bottom_nav_hide_on_scroll === 'true'} onCheckedChange={(c) => setValues(prev => ({ ...prev, bottom_nav_hide_on_scroll: c ? 'true' : 'false' }))} />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {sliders.map(s => {
            const val = toNumber(values[s.key], 0);
            return (
              <div key={s.key} className="space-y-2 border rounded-lg p-4">
                <Label className="text-sm font-medium">{s.title}: {val}{s.unit}</Label>
                <Slider value={[val]} onValueChange={([v]) => setValues(prev => ({ ...prev, [s.key]: String(v) }))} min={s.min} max={s.max} step={s.step} />
              </div>
            );
          })}
        </div>
      </div>
    </SettingsPageWrapper>
  );
}
