import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useSettingsData, toNumber } from './useSettingsData';
import { SettingsPageWrapper } from './SettingsPageWrapper';

export default function QuickViewSettings() {
  const { values, setValues, isLoading, saveMutation } = useSettingsData();

  const qvMaxW = toNumber(values.quickview_max_width, 92);
  const qvMaxH = toNumber(values.quickview_max_height, 85);
  const qvImgRatio = values.quickview_image_ratio || '3/4';
  const qvRadius = toNumber(values.quickview_border_radius, 16);
  const qvImgRadius = toNumber(values.quickview_image_radius, 12);

  const closeSize = toNumber(values.quickview_close_size, 32);
  const closeIconSize = toNumber(values.quickview_close_icon_size, 16);
  const closeBorderWidth = toNumber(values.quickview_close_border_width, 1);
  const closeBorderRadius = toNumber(values.quickview_close_border_radius, 50);
  const closeOpacity = toNumber(values.quickview_close_opacity, 80);

  const sliders = [
    { key: 'quickview_max_width', min: 60, max: 100, step: 1, unit: 'vw', title: 'পপআপ ম্যাক্স উইডথ' },
    { key: 'quickview_max_height', min: 50, max: 100, step: 1, unit: 'vh', title: 'পপআপ ম্যাক্স হাইট' },
    { key: 'quickview_border_radius', min: 0, max: 40, step: 2, unit: 'px', title: 'পপআপ বর্ডার রেডিয়াস' },
    { key: 'quickview_image_radius', min: 0, max: 30, step: 2, unit: 'px', title: 'ইমেজ বর্ডার রেডিয়াস' },
  ];

  const closeSliders = [
    { key: 'quickview_close_size', min: 20, max: 56, step: 2, unit: 'px', title: '✕ বাটন সাইজ' },
    { key: 'quickview_close_icon_size', min: 10, max: 32, step: 1, unit: 'px', title: '✕ আইকন সাইজ' },
    { key: 'quickview_close_border_width', min: 0, max: 4, step: 1, unit: 'px', title: '✕ বর্ডার উইডথ' },
    { key: 'quickview_close_border_radius', min: 0, max: 50, step: 2, unit: '%', title: '✕ বর্ডার রেডিয়াস' },
    { key: 'quickview_close_opacity', min: 0, max: 100, step: 5, unit: '%', title: '✕ ব্যাকগ্রাউন্ড অপাসিটি' },
  ];
  const ratioOptions = ['1/1', '3/4', '4/5', '2/3', '9/16', '16/9'];
  const ratioParts = qvImgRatio.split('/');
  const ratioW = parseFloat(ratioParts[0]) || 3;
  const ratioH = parseFloat(ratioParts[1]) || 4;

  if (isLoading) return <div className="text-center py-10 text-muted-foreground">লোড হচ্ছে...</div>;

  return (
    <SettingsPageWrapper title="🛍️ কুইক ভিউ পপআপ" onSave={() => saveMutation.mutate()} isSaving={saveMutation.isPending}>
      <div className="bg-card border rounded-xl p-5 space-y-5">
        {/* Preview */}
        <div className="border rounded-lg p-6 bg-muted/30 flex items-center justify-center">
          <div className="bg-background border border-border shadow-xl flex flex-col items-center justify-center relative"
            style={{ width: `${Math.min(qvMaxW * 2.5, 250)}px`, height: `${Math.min(qvMaxH * 2, 200)}px`, borderRadius: `${qvRadius}px` }}>
            <div className="bg-muted/50 w-3/4" style={{ aspectRatio: `${ratioW}/${ratioH}`, maxHeight: '60%', borderRadius: `${qvImgRadius}px` }} />
            <div className="mt-2 w-3/4 h-2 bg-muted rounded" />
            <span className="absolute bottom-1 text-[8px] text-muted-foreground">প্রিভিউ</span>
          </div>
        </div>

        <div className="space-y-2 border rounded-lg p-4">
          <Label className="text-sm font-medium">ইমেজ রেশিও: {qvImgRatio}</Label>
          <div className="flex gap-2 flex-wrap">
            {ratioOptions.map(opt => (
              <button key={opt} type="button" onClick={() => setValues(prev => ({ ...prev, quickview_image_ratio: opt }))}
                className={cn("px-4 py-2 rounded-lg text-sm font-medium border transition-colors", values.quickview_image_ratio === opt ? 'border-primary bg-primary/10 text-primary' : 'border-border')}>
                {opt}
              </button>
            ))}
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

        {/* Close Button Settings */}
        <div className="border rounded-lg p-4 space-y-4">
          <Label className="text-base font-semibold">✕ ক্লোজ বাটন সেটিংস</Label>
          {/* Close button preview */}
          <div className="flex items-center justify-center py-4 bg-muted/30 rounded-lg">
            <div
              className="flex items-center justify-center bg-background border border-border shadow-md cursor-default"
              style={{
                width: `${closeSize}px`,
                height: `${closeSize}px`,
                borderWidth: `${closeBorderWidth}px`,
                borderRadius: `${closeBorderRadius}%`,
                opacity: closeOpacity / 100,
              }}
            >
              <span style={{ fontSize: `${closeIconSize}px`, lineHeight: 1 }}>✕</span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {closeSliders.map(s => {
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
      </div>
    </SettingsPageWrapper>
  );
}
