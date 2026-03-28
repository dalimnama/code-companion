import { useSettingsData } from './useSettingsData';
import { SettingsPageWrapper } from './SettingsPageWrapper';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Check } from 'lucide-react';

const colorFields = [
  { key: 'color_primary', label: '🎨 প্রাইমারি কালার', desc: 'মেইন ব্র্যান্ড কালার (বাটন, লিংক, হেডার)' },
  { key: 'color_accent', label: '✨ অ্যাকসেন্ট কালার', desc: 'হাইলাইট ও ব্যাজ কালার' },
  { key: 'color_sale', label: '🔴 সেল/ডিসকাউন্ট কালার', desc: 'সেল ব্যাজ ও দাম কালার' },
  { key: 'color_background', label: '🖼️ ব্যাকগ্রাউন্ড কালার', desc: 'পেজ ব্যাকগ্রাউন্ড' },
  { key: 'color_foreground', label: '📝 টেক্সট কালার', desc: 'মেইন টেক্সট কালার' },
  { key: 'color_card', label: '🃏 কার্ড ব্যাকগ্রাউন্ড', desc: 'কার্ড ও পপআপ ব্যাকগ্রাউন্ড' },
];

function hexToHsl(hex: string): string | null {
  hex = hex.replace('#', '');
  if (hex.length !== 6) return null;
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function hslToHex(hsl: string): string {
  const parts = hsl.match(/(\d+)\s+(\d+)%?\s+(\d+)%?/);
  if (!parts) return '#10b981';
  const h = parseInt(parts[1]) / 360;
  const s = parseInt(parts[2]) / 100;
  const l = parseInt(parts[3]) / 100;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const defaultHslValues: Record<string, string> = {
  color_primary: '160 84% 39%',
  color_accent: '35 100% 50%',
  color_sale: '0 84% 60%',
  color_background: '0 0% 99%',
  color_foreground: '220 20% 10%',
  color_card: '0 0% 100%',
};

interface ThemePreset {
  name: string;
  emoji: string;
  colors: Record<string, string>;
}

const themePresets: ThemePreset[] = [
  {
    name: 'Emerald',
    emoji: '🌿',
    colors: { color_primary: '160 84% 39%', color_accent: '35 100% 50%', color_sale: '0 84% 60%', color_background: '0 0% 99%', color_foreground: '220 20% 10%', color_card: '0 0% 100%' },
  },
  {
    name: 'Ocean Blue',
    emoji: '🌊',
    colors: { color_primary: '217 91% 50%', color_accent: '199 89% 48%', color_sale: '0 84% 60%', color_background: '210 20% 98%', color_foreground: '222 47% 11%', color_card: '0 0% 100%' },
  },
  {
    name: 'Royal Purple',
    emoji: '👑',
    colors: { color_primary: '262 83% 58%', color_accent: '280 68% 50%', color_sale: '350 89% 60%', color_background: '270 10% 98%', color_foreground: '260 20% 12%', color_card: '0 0% 100%' },
  },
  {
    name: 'Sunset',
    emoji: '🌅',
    colors: { color_primary: '25 95% 53%', color_accent: '38 92% 50%', color_sale: '0 84% 60%', color_background: '30 10% 98%', color_foreground: '20 14% 10%', color_card: '0 0% 100%' },
  },
  {
    name: 'Rose Pink',
    emoji: '🌸',
    colors: { color_primary: '346 77% 50%', color_accent: '330 80% 60%', color_sale: '0 84% 55%', color_background: '340 10% 98%', color_foreground: '340 20% 10%', color_card: '0 0% 100%' },
  },
  {
    name: 'Forest',
    emoji: '🌲',
    colors: { color_primary: '142 71% 35%', color_accent: '84 60% 45%', color_sale: '0 84% 60%', color_background: '140 10% 97%', color_foreground: '150 20% 10%', color_card: '0 0% 100%' },
  },
  {
    name: 'Midnight',
    emoji: '🌙',
    colors: { color_primary: '210 100% 56%', color_accent: '200 90% 50%', color_sale: '0 84% 60%', color_background: '222 47% 6%', color_foreground: '210 40% 95%', color_card: '222 40% 10%' },
  },
  {
    name: 'Coffee',
    emoji: '☕',
    colors: { color_primary: '25 40% 40%', color_accent: '35 60% 50%', color_sale: '0 70% 55%', color_background: '30 20% 96%', color_foreground: '25 30% 12%', color_card: '30 15% 100%' },
  },
  {
    name: 'Teal',
    emoji: '🧊',
    colors: { color_primary: '174 72% 40%', color_accent: '190 80% 42%', color_sale: '0 84% 60%', color_background: '180 10% 98%', color_foreground: '180 15% 10%', color_card: '0 0% 100%' },
  },
  {
    name: 'Charcoal',
    emoji: '🖤',
    colors: { color_primary: '0 0% 15%', color_accent: '45 80% 50%', color_sale: '0 84% 60%', color_background: '0 0% 98%', color_foreground: '0 0% 10%', color_card: '0 0% 100%' },
  },
];

function isCurrentTheme(preset: ThemePreset, values: Record<string, string>): boolean {
  return colorFields.every(f => (values[f.key] || defaultHslValues[f.key]) === preset.colors[f.key]);
}

export default function ColorSettings() {
  const { values, setValues, isLoading, saveMutation } = useSettingsData();

  const handleColorChange = (key: string, hex: string) => {
    const hsl = hexToHsl(hex);
    if (hsl) {
      setValues(prev => ({ ...prev, [key]: hsl }));
    }
  };

  const applyTheme = (preset: ThemePreset) => {
    setValues(prev => ({ ...prev, ...preset.colors }));
  };

  if (isLoading) return <div className="text-center py-10 text-muted-foreground">লোড হচ্ছে...</div>;

  return (
    <SettingsPageWrapper title="🎨 কালার সেটিংস" onSave={() => saveMutation.mutate()} isSaving={saveMutation.isPending}>
      {/* Theme Presets */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <div>
          <h2 className="font-bold text-lg">🎭 রেডিমেড থিম</h2>
          <p className="text-sm text-muted-foreground mt-1">একটি থিম সিলেক্ট করুন, তারপর সেভ করুন।</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {themePresets.map(preset => {
            const active = isCurrentTheme(preset, values);
            const primaryHex = hslToHex(preset.colors.color_primary);
            const accentHex = hslToHex(preset.colors.color_accent);
            const bgHex = hslToHex(preset.colors.color_background);
            const fgHex = hslToHex(preset.colors.color_foreground);
            return (
              <button
                key={preset.name}
                onClick={() => applyTheme(preset)}
                className={`relative group rounded-xl border-2 p-3 text-left transition-all duration-200 hover:shadow-md ${
                  active ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/40'
                }`}
              >
                {active && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
                {/* Color swatches */}
                <div className="flex gap-1 mb-2.5">
                  <div className="w-6 h-6 rounded-full border border-border/50" style={{ backgroundColor: primaryHex }} />
                  <div className="w-6 h-6 rounded-full border border-border/50" style={{ backgroundColor: accentHex }} />
                  <div className="w-6 h-6 rounded-full border border-border/50" style={{ backgroundColor: bgHex }} />
                  <div className="w-6 h-6 rounded-full border border-border/50" style={{ backgroundColor: fgHex }} />
                </div>
                <p className="text-xs font-semibold truncate">{preset.emoji} {preset.name}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Color Customization */}
      <div className="bg-card border rounded-xl p-5 space-y-5">
        <h2 className="font-bold text-lg">🎨 কাস্টম কালার</h2>
        <p className="text-sm text-muted-foreground">নিজের পছন্দমতো কালার সেট করুন।</p>
        <div className="grid gap-5 sm:grid-cols-2">
          {colorFields.map(field => {
            const hslValue = values[field.key] || defaultHslValues[field.key] || '0 0% 50%';
            const hexValue = hslToHex(hslValue);
            return (
              <div key={field.key} className="space-y-2">
                <Label className="text-sm font-medium">{field.label}</Label>
                <p className="text-xs text-muted-foreground">{field.desc}</p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={hexValue}
                    onChange={e => handleColorChange(field.key, e.target.value)}
                    className="w-12 h-10 rounded-lg border cursor-pointer shrink-0"
                  />
                  <Input
                    value={hexValue}
                    onChange={e => handleColorChange(field.key, e.target.value)}
                    className="font-mono text-sm"
                    placeholder="#000000"
                  />
                  <div
                    className="w-10 h-10 rounded-lg border shrink-0"
                    style={{ backgroundColor: hexValue }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Preview */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <h2 className="font-bold text-lg">🔍 প্রিভিউ</h2>
        <div className="rounded-xl border p-6 space-y-4" style={{
          backgroundColor: hslToHex(values.color_background || defaultHslValues.color_background),
          color: hslToHex(values.color_foreground || defaultHslValues.color_foreground),
        }}>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{
              backgroundColor: hslToHex(values.color_primary || defaultHslValues.color_primary),
            }}>
              প্রাইমারি বাটন
            </div>
            <div className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{
              backgroundColor: hslToHex(values.color_accent || defaultHslValues.color_accent),
            }}>
              অ্যাকসেন্ট ব্যাজ
            </div>
            <div className="px-3 py-1 rounded text-white text-xs font-bold" style={{
              backgroundColor: hslToHex(values.color_sale || defaultHslValues.color_sale),
            }}>
              -30%
            </div>
          </div>
          <div className="rounded-lg p-4 border" style={{
            backgroundColor: hslToHex(values.color_card || defaultHslValues.color_card),
          }}>
            <p className="text-sm" style={{ color: hslToHex(values.color_foreground || defaultHslValues.color_foreground) }}>
              এটি একটি কার্ডের প্রিভিউ। এখানে প্রোডাক্ট দেখানো হবে।
            </p>
          </div>
        </div>
      </div>
    </SettingsPageWrapper>
  );
}
