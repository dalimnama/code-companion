import { SettingsPageWrapper } from './SettingsPageWrapper';
import { useSettingsData } from './useSettingsData';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Eye, Star, Shield } from 'lucide-react';

const sections = [
  { key: 'show_trust_badges', label: '🛡️ Trust Badges', desc: 'Authentic Products, Cash on Delivery, Fast Delivery, Secure Payment', icon: Shield },
  { key: 'show_customer_reviews', label: '⭐ Customer Reviews', desc: 'কাস্টমার রিভিউ ক্যারোসেল সেকশন', icon: Star },
];

export default function HomepageSectionsSettings() {
  const { values, setValues, saveMutation } = useSettingsData();

  const toggle = (key: string) => {
    const current = values[key] !== 'false'; // default true
    setValues((prev) => ({ ...prev, [key]: current ? 'false' : 'true' }));
  };

  return (
    <SettingsPageWrapper
      title="হোমপেজ সেকশন"
      onSave={() => saveMutation.mutate()}
      isSaving={saveMutation.isPending}
    >
      <div className="space-y-3">
        {sections.map((s) => {
          const isOn = values[s.key] !== 'false'; // default true if not set
          return (
            <div
              key={s.key}
              className="flex items-center justify-between gap-4 bg-card border rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <Label className="font-semibold text-sm cursor-pointer">{s.label}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
              </div>
              <Switch checked={isOn} onCheckedChange={() => toggle(s.key)} />
            </div>
          );
        })}
      </div>
    </SettingsPageWrapper>
  );
}
