import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useSettingsData } from './useSettingsData';
import { SettingsPageWrapper } from './SettingsPageWrapper';

export default function ImageRadiusSettings() {
  const { values, setValues, settings, isLoading, saveMutation } = useSettingsData();
  const items = settings?.filter(s => s.category === 'image_radius') || [];

  if (isLoading) return <div className="text-center py-10 text-muted-foreground">লোড হচ্ছে...</div>;

  return (
    <SettingsPageWrapper title="🔲 ইমেজ রেডিয়াস" onSave={() => saveMutation.mutate()} isSaving={saveMutation.isPending}>
      <div className="bg-card border rounded-xl p-5 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          {items.map(s => {
            const val = parseInt(values[s.key] || '16', 10);
            return (
              <div key={s.id} className="space-y-2">
                <Label className="text-sm font-medium">{s.label || s.key}: {val}px</Label>
                <Slider value={[val]} onValueChange={([v]) => setValues(prev => ({ ...prev, [s.key]: String(v) }))} min={0} max={40} step={2} />
                <div className="flex justify-center pt-1">
                  <div className="w-20 h-20 bg-primary/20 border border-primary/30" style={{ borderRadius: `${val}px` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SettingsPageWrapper>
  );
}
