import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useSettingsData } from './useSettingsData';
import { SettingsPageWrapper } from './SettingsPageWrapper';

export default function BannerSettings() {
  const { values, setValues, settings, isLoading, saveMutation } = useSettingsData();
  const items = settings?.filter(s => s.category === 'banner') || [];
  const toggleKeys = ['banner_progress_bar'];
  const sliderKeys = ['banner_overlay_opacity'];
  const toggleItems = items.filter(s => toggleKeys.includes(s.key));
  const sliderItems = items.filter(s => sliderKeys.includes(s.key));
  const otherItems = items.filter(s => !toggleKeys.includes(s.key) && !sliderKeys.includes(s.key));

  if (isLoading) return <div className="text-center py-10 text-muted-foreground">লোড হচ্ছে...</div>;

  return (
    <SettingsPageWrapper title="🖼️ ব্যানার" onSave={() => saveMutation.mutate()} isSaving={saveMutation.isPending}>
      <div className="bg-card border rounded-xl p-5 space-y-5">
        {toggleItems.map(s => (
          <div key={s.id} className="flex items-center justify-between border rounded-lg p-4">
            <Label className="text-sm font-medium">{s.label || s.key}</Label>
            <Switch checked={values[s.key] === 'true'} onCheckedChange={(c) => setValues(prev => ({ ...prev, [s.key]: c ? 'true' : 'false' }))} />
          </div>
        ))}
        {sliderItems.map(s => {
          const val = parseInt(values[s.key] || '60', 10);
          return (
            <div key={s.id} className="space-y-3 border rounded-lg p-4">
              <Label className="text-sm font-medium">{s.label || s.key}: {val}%</Label>
              <Slider value={[val]} onValueChange={([v]) => setValues(prev => ({ ...prev, [s.key]: String(v) }))} min={0} max={100} step={5} />
              <div className="relative h-16 rounded-lg overflow-hidden bg-gradient-to-r from-primary/30 to-accent/30">
                <div className="absolute inset-0" style={{ background: `linear-gradient(to top, rgba(0,0,0,${val / 100}), transparent 60%, transparent)` }} />
              </div>
            </div>
          );
        })}
        {otherItems.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {otherItems.map(s => (
              <div key={s.id} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{s.label || s.key}</Label>
                <Input value={values[s.key] || ''} onChange={e => setValues(prev => ({ ...prev, [s.key]: e.target.value }))} />
              </div>
            ))}
          </div>
        )}
      </div>
    </SettingsPageWrapper>
  );
}
