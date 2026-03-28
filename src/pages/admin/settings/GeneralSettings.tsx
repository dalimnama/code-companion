import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useSettingsData } from './useSettingsData';
import { SettingsPageWrapper } from './SettingsPageWrapper';

const generalCategories = ['general', 'contact', 'payment', 'shipping', 'social'];
const categoryLabels: Record<string, string> = {
  general: '⚙️ সাধারণ',
  contact: '📞 যোগাযোগ',
  payment: '💳 পেমেন্ট',
  shipping: '🚚 শিপিং',
  social: '📱 সোশ্যাল মিডিয়া',
};

export default function GeneralSettings() {
  const { values, setValues, settings, isLoading, saveMutation } = useSettingsData();

  const grouped: Record<string, typeof settings> = {};
  settings?.filter(s => generalCategories.includes(s.category)).forEach(s => {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category]!.push(s);
  });

  if (isLoading) return <div className="text-center py-10 text-muted-foreground">লোড হচ্ছে...</div>;

  return (
    <SettingsPageWrapper title="⚙️ সাধারণ সেটিংস" onSave={() => saveMutation.mutate()} isSaving={saveMutation.isPending}>
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="bg-card border rounded-xl p-5 space-y-4">
          <h2 className="font-bold text-lg">{categoryLabels[cat] || cat}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {items?.map(s => (
              <div key={s.id} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{s.label || s.key}</Label>
                <Input value={values[s.key] || ''} onChange={e => setValues(prev => ({ ...prev, [s.key]: e.target.value }))} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </SettingsPageWrapper>
  );
}
