import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsData, toNumber } from './useSettingsData';
import { SettingsPageWrapper } from './SettingsPageWrapper';

const colorOptions = [
  { value: 'foreground', label: 'Foreground', cssVar: '--foreground' },
  { value: 'primary', label: 'Primary', cssVar: '--primary' },
  { value: 'border', label: 'Border', cssVar: '--border' },
  { value: 'muted-foreground', label: 'Muted', cssVar: '--muted-foreground' },
];

export default function OrderButtonSettings() {
  const { values, setValues, isLoading, saveMutation } = useSettingsData();

  const btnHeight = toNumber(values.order_btn_height, 40);
  const btnBorderWidth = toNumber(values.order_btn_border_width, 2);
  const btnBorderRadius = toNumber(values.order_btn_border_radius, 8);
  const btnFontSize = toNumber(values.order_btn_font_size, 14);
  const btnBorderColor = values.order_btn_border_color || 'foreground';

  const borderColorCss = `hsl(var(--${btnBorderColor}))`;

  const sliders = [
    { key: 'order_btn_height', min: 32, max: 56, step: 2, unit: 'px', title: 'বাটন হাইট' },
    { key: 'order_btn_border_width', min: 0, max: 4, step: 1, unit: 'px', title: 'বর্ডার উইডথ' },
    { key: 'order_btn_border_radius', min: 0, max: 24, step: 2, unit: 'px', title: 'বর্ডার রেডিয়াস' },
    { key: 'order_btn_font_size', min: 10, max: 18, step: 1, unit: 'px', title: 'ফন্ট সাইজ' },
  ];

  if (isLoading) return <div className="text-center py-10 text-muted-foreground">লোড হচ্ছে...</div>;

  return (
    <SettingsPageWrapper title="🛒 অর্ডার বাটন" onSave={() => saveMutation.mutate()} isSaving={saveMutation.isPending}>
      <div className="bg-card border rounded-xl p-5 space-y-5">
        {/* Live Preview */}
        <div className="border rounded-lg p-6 bg-muted/30 flex items-center justify-center">
          <div className="w-full max-w-[220px]">
            <button
              className="w-full inline-flex items-center justify-center gap-1.5 font-semibold bg-transparent transition-colors"
              style={{
                height: `${btnHeight}px`,
                borderWidth: `${btnBorderWidth}px`,
                borderStyle: 'solid',
                borderColor: borderColorCss,
                borderRadius: `${btnBorderRadius}px`,
                fontSize: `${btnFontSize}px`,
              }}
            >
              <ShoppingCart style={{ width: `${btnFontSize}px`, height: `${btnFontSize}px` }} />
              Order Now
            </button>
            <p className="text-center text-[10px] text-muted-foreground mt-2">লাইভ প্রিভিউ</p>
          </div>
        </div>

        {/* Sliders */}
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

        {/* Border Color */}
        <div className="space-y-2 border rounded-lg p-4">
          <Label className="text-sm font-medium">বর্ডার কালার</Label>
          <div className="flex gap-2 flex-wrap">
            {colorOptions.map(opt => (
              <button key={opt.value} type="button" onClick={() => setValues(prev => ({ ...prev, order_btn_border_color: opt.value }))}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                  btnBorderColor === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border'
                )}>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: `hsl(var(${opt.cssVar}))` }} />
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </SettingsPageWrapper>
  );
}
