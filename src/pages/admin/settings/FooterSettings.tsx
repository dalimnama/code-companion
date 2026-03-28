import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useSettingsData, toNumber } from './useSettingsData';
import { SettingsPageWrapper } from './SettingsPageWrapper';

export default function FooterSettings() {
  const { values, setValues, settings, isLoading, saveMutation } = useSettingsData();
  const items = settings?.filter(s => s.category === 'footer') || [];

  const sliderConfigs: Record<string, { min: number; max: number; step: number; unit: string }> = {
    footer_copyright_height: { min: 20, max: 80, step: 2, unit: 'px' },
    footer_copyright_padding_x: { min: 4, max: 60, step: 2, unit: 'px' },
    footer_copyright_padding_y: { min: 2, max: 30, step: 2, unit: 'px' },
    footer_copyright_radius: { min: 0, max: 9999, step: 1, unit: 'px' },
    footer_copyright_border_width: { min: 0, max: 5, step: 1, unit: 'px' },
    footer_copyright_bg_opacity: { min: 0, max: 100, step: 5, unit: '%' },
    footer_copyright_font_size: { min: 8, max: 20, step: 1, unit: 'px' },
  };
  const footerSliderKeys = Object.keys(sliderConfigs);
  const toggleKeys = ['footer_copyright_active'];
  const borderColorOptions = [
    { value: 'primary', label: 'Primary' },
    { value: 'border', label: 'Border' },
    { value: 'muted', label: 'Muted' },
    { value: 'accent', label: 'Accent' },
  ];

  const toggleItem = items.filter(s => toggleKeys.includes(s.key));
  const sliderItems = items.filter(s => footerSliderKeys.includes(s.key));
  const selectItems = items.filter(s => s.key === 'footer_copyright_border_color');

  const pHeight = values.footer_copyright_height || '40';
  const pPx = values.footer_copyright_padding_x || '20';
  const pPy = values.footer_copyright_padding_y || '8';
  const pRadius = values.footer_copyright_radius || '9999';
  const pBorderW = values.footer_copyright_border_width || '1';
  const pBgOp = parseInt(values.footer_copyright_bg_opacity || '5', 10) / 100;
  const pFontSize = values.footer_copyright_font_size || '12';

  if (isLoading) return <div className="text-center py-10 text-muted-foreground">লোড হচ্ছে...</div>;

  return (
    <SettingsPageWrapper title="🦶 ফুটার কপিরাইট বার" onSave={() => saveMutation.mutate()} isSaving={saveMutation.isPending}>
      <div className="bg-card border rounded-xl p-5 space-y-5">
        {/* Preview */}
        <div className="border rounded-lg p-6 bg-muted/30 flex items-center justify-center">
          <div className="inline-flex items-center gap-2" style={{
            minHeight: `${pHeight}px`, padding: `${pPy}px ${pPx}px`,
            borderRadius: `${pRadius}px`, border: `${pBorderW}px solid hsl(var(--primary) / 0.1)`,
            background: `hsl(var(--primary) / ${pBgOp})`, fontSize: `${pFontSize}px`,
          }}>
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-muted-foreground font-medium tracking-wider">© 2026 rikapio</span>
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          </div>
        </div>

        {toggleItem.map(s => (
          <div key={s.id} className="flex items-center justify-between border rounded-lg p-4">
            <Label className="text-sm font-medium">{s.label || s.key}</Label>
            <Switch checked={values[s.key] === 'true'} onCheckedChange={(c) => setValues(prev => ({ ...prev, [s.key]: c ? 'true' : 'false' }))} />
          </div>
        ))}

        <div className="grid gap-5 sm:grid-cols-2">
          {sliderItems.map(s => {
            const config = sliderConfigs[s.key] || { min: 0, max: 100, step: 1, unit: '' };
            const val = parseInt(values[s.key] || '0', 10);
            return (
              <div key={s.id} className="space-y-2 border rounded-lg p-4">
                <Label className="text-sm font-medium">{s.label || s.key}: {val}{config.unit}</Label>
                <Slider value={[val]} onValueChange={([v]) => setValues(prev => ({ ...prev, [s.key]: String(v) }))} min={config.min} max={config.max} step={config.step} />
              </div>
            );
          })}
        </div>

        {selectItems.map(s => (
          <div key={s.id} className="space-y-2 border rounded-lg p-4">
            <Label className="text-sm font-medium">{s.label || s.key}</Label>
            <div className="flex gap-2 flex-wrap">
              {borderColorOptions.map(opt => (
                <button key={opt.value} type="button" onClick={() => setValues(prev => ({ ...prev, [s.key]: opt.value }))}
                  className={cn("px-4 py-2 rounded-lg text-sm font-medium border transition-colors", values[s.key] === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border')}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SettingsPageWrapper>
  );
}
