import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useSettingsData } from './useSettingsData';
import { SettingsPageWrapper } from './SettingsPageWrapper';

export default function ImageRatioSettings() {
  const { values, setValues, settings, isLoading, saveMutation } = useSettingsData();
  const items = settings?.filter(s => s.category === 'image_ratio') || [];

  if (isLoading) return <div className="text-center py-10 text-muted-foreground">লোড হচ্ছে...</div>;

  return (
    <SettingsPageWrapper title="🖼️ ইমেজ রেশিও" onSave={() => saveMutation.mutate()} isSaving={saveMutation.isPending}>
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map(s => (
            <div key={s.id} className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{s.label || s.key}</Label>
              <Input value={values[s.key] || ''} onChange={e => setValues(prev => ({ ...prev, [s.key]: e.target.value }))} />
            </div>
          ))}
        </div>
      </div>
    </SettingsPageWrapper>
  );
}
