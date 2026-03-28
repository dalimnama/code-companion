import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { useSettingsData } from './useSettingsData';
import { SettingsPageWrapper } from './SettingsPageWrapper';

export default function AiSettings() {
  const { values, setValues, isLoading, saveMutation } = useSettingsData();

  const isEnabled = values.ai_enabled !== 'false';
  const aiName = values.ai_name || 'rikapio AI';
  const aiSubtitle = values.ai_subtitle || 'সবসময় আপনার পাশে';
  const welcomeTitle = values.ai_welcome_title || 'হ্যায়! কী খুঁজছেন? 🔍';
  const welcomeSubtitle = values.ai_welcome_subtitle || 'আমি আপনার শপিং বাডি — প্রোডাক্ট, অফার, অর্ডার সব জানি!';
  const behaviorPrompt = values.ai_behavior_prompt || 'আপনি একজন বন্ধুসুলভ, প্রফেশনাল এবং মডার্ন শপিং অ্যাসিস্ট্যান্ট।';
  const responseStylePrompt = values.ai_response_style_prompt || 'রিপ্লাই ছোট, পরিষ্কার, helpful এবং human-like রাখুন; অযথা formal বা repetitive হবেন না।';
  const firstMessagePrompt = values.ai_first_message_prompt || 'শুধু কথোপকথনের প্রথম রিপ্লাইতে ছোট্ট friendly greeting দিন, এরপর সরাসরি সমস্যার সমাধানে যান।';
  const avoidPhrases = values.ai_avoid_phrases || 'আসসালামু আলাইকুম, রিকাপিও এআই-তে আপনাকে স্বাগতম';

  // Quick prompts stored as JSON
  let quickPrompts: { icon: string; text: string }[] = [];
  try {
    quickPrompts = values.ai_quick_prompts ? JSON.parse(values.ai_quick_prompts) : [];
  } catch {
    quickPrompts = [];
  }
  if (quickPrompts.length === 0) {
    quickPrompts = [
      { icon: '🛍️', text: 'কোন পণ্য জনপ্রিয়?' },
      { icon: '📦', text: 'অর্ডার ট্র্যাক করতে চাই' },
      { icon: '🏷️', text: 'কোনো অফার আছে?' },
      { icon: '🚚', text: 'ডেলিভারি চার্জ কত?' },
    ];
  }

  const updateValue = (key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
  };

  const updatePrompt = (index: number, field: 'icon' | 'text', val: string) => {
    const updated = [...quickPrompts];
    updated[index] = { ...updated[index], [field]: val };
    updateValue('ai_quick_prompts', JSON.stringify(updated));
  };

  const addPrompt = () => {
    const updated = [...quickPrompts, { icon: '💬', text: '' }];
    updateValue('ai_quick_prompts', JSON.stringify(updated));
  };

  const removePrompt = (index: number) => {
    const updated = quickPrompts.filter((_, i) => i !== index);
    updateValue('ai_quick_prompts', JSON.stringify(updated));
  };

  if (isLoading) return <div className="text-center py-10 text-muted-foreground">লোড হচ্ছে...</div>;

  return (
    <SettingsPageWrapper title="🤖 AI অ্যাসিস্ট্যান্ট সেটিংস" onSave={() => saveMutation.mutate()} isSaving={saveMutation.isPending}>
      {/* Enable/Disable */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <h2 className="font-bold text-lg">AI চ্যাটবট অন/অফ</h2>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">AI অ্যাসিস্ট্যান্ট সক্রিয়</Label>
            <p className="text-xs text-muted-foreground mt-0.5">অফ করলে ফ্লোটিং বাটন ও চ্যাটবট দেখা যাবে না</p>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={(checked) => updateValue('ai_enabled', checked ? 'true' : 'false')}
          />
        </div>
      </div>

      {/* Name & Subtitle */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <h2 className="font-bold text-lg">🏷️ নাম ও পরিচয়</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">AI এর নাম</Label>
            <Input value={aiName} onChange={e => updateValue('ai_name', e.target.value)} placeholder="rikapio AI" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">সাবটাইটেল</Label>
            <Input value={aiSubtitle} onChange={e => updateValue('ai_subtitle', e.target.value)} placeholder="সবসময় আপনার পাশে" />
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <h2 className="font-bold text-lg">👋 ওয়েলকাম মেসেজ</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">ওয়েলকাম টাইটেল</Label>
            <Input value={welcomeTitle} onChange={e => updateValue('ai_welcome_title', e.target.value)} placeholder="হ্যায়! কী খুঁজছেন?" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">ওয়েলকাম সাবটাইটেল</Label>
            <Input value={welcomeSubtitle} onChange={e => updateValue('ai_welcome_subtitle', e.target.value)} placeholder="পণ্য, অর্ডার বা যেকোনো বিষয়ে জিজ্ঞাসা করুন" />
          </div>
        </div>
      </div>

      {/* AI Writing Style */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <h2 className="font-bold text-lg">🧠 AI লেখার স্টাইল</h2>
        <p className="text-xs text-muted-foreground">এখানে যা লিখবেন, AI সেই স্টাইল/টোন অনুযায়ী রিপ্লাই দেবে।</p>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">AI পারসোনা নির্দেশনা</Label>
          <Textarea
            value={behaviorPrompt}
            onChange={e => updateValue('ai_behavior_prompt', e.target.value)}
            placeholder="বন্ধুসুলভ, প্রফেশনাল, মডার্ন শপিং অ্যাসিস্ট্যান্ট..."
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">রিপ্লাই স্টাইল নির্দেশনা</Label>
          <Textarea
            value={responseStylePrompt}
            onChange={e => updateValue('ai_response_style_prompt', e.target.value)}
            placeholder="রিপ্লাই ছোট, clear, human-like, engaging রাখুন..."
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">প্রথম মেসেজ নির্দেশনা</Label>
          <Textarea
            value={firstMessagePrompt}
            onChange={e => updateValue('ai_first_message_prompt', e.target.value)}
            placeholder="শুধু প্রথম মেসেজে greeting দিন..."
            rows={2}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">যে শব্দ/লাইন এড়াতে হবে (কমা দিয়ে)</Label>
          <Input
            value={avoidPhrases}
            onChange={e => updateValue('ai_avoid_phrases', e.target.value)}
            placeholder="আসসালামু আলাইকুম, স্বাগতম"
          />
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">⚡ কুইক প্রম্পট</h2>
          {quickPrompts.length < 6 && (
            <Button variant="outline" size="sm" onClick={addPrompt} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> যোগ করুন
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">চ্যাট খোলার সময় এই প্রম্পটগুলো দেখানো হবে</p>
        <div className="space-y-3">
          {quickPrompts.map((prompt, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={prompt.icon}
                onChange={e => updatePrompt(i, 'icon', e.target.value)}
                className="w-16 text-center text-lg"
                placeholder="🛍️"
              />
              <Input
                value={prompt.text}
                onChange={e => updatePrompt(i, 'text', e.target.value)}
                className="flex-1"
                placeholder="প্রম্পট টেক্সট"
              />
              <Button variant="ghost" size="icon" onClick={() => removePrompt(i)} className="text-destructive hover:text-destructive shrink-0">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Image Border */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <h2 className="font-bold text-lg">🖼️ ইমেজ বর্ডার সেটিংস</h2>
        <p className="text-xs text-muted-foreground">চ্যাটে ইউজারের পাঠানো ছবির চারপাশে বর্ডার কাস্টমাইজ করুন</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">বর্ডার সাইজ (px)</Label>
            <Input
              type="number"
              min={0}
              max={30}
              value={values.ai_image_border_size ?? '0'}
              onChange={e => updateValue('ai_image_border_size', e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">বর্ডার কালার</Label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={values.ai_image_border_color || '#16a34a'}
                onChange={e => updateValue('ai_image_border_color', e.target.value)}
                className="w-11 h-10 rounded-lg border cursor-pointer"
              />
              <Input
                value={values.ai_image_border_color || '#16a34a'}
                onChange={e => updateValue('ai_image_border_color', e.target.value)}
                placeholder="#16a34a"
                className="flex-1"
              />
            </div>
          </div>
        </div>
        {/* Live preview */}
        {Number(values.ai_image_border_size || 0) > 0 && (
          <div className="flex justify-end">
            <div
              className="rounded-2xl rounded-br-sm overflow-hidden"
              style={{
                padding: `${values.ai_image_border_size || 0}px`,
                backgroundColor: values.ai_image_border_color || '#16a34a',
                maxWidth: '180px',
              }}
            >
              <div className="bg-muted rounded-xl h-24 w-40 flex items-center justify-center text-xs text-muted-foreground">
                প্রিভিউ
              </div>
              <div className="px-2 py-1 text-[11px] text-white">হ্যালো</div>
            </div>
          </div>
        )}
      </div>

      {/* Close Button Size */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <h2 className="font-bold text-lg">⬇️ ক্লোজ বাটন সেটিংস</h2>
        <p className="text-xs text-muted-foreground">উইজেট হেডারের ক্লোজ/মিনিমাইজ বাটনের সাইজ কাস্টমাইজ করুন</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">বাটন কন্টেইনার সাইজ (px)</Label>
            <Input
              type="number"
              min={20}
              max={50}
              value={values.ai_close_btn_container_size ?? '28'}
              onChange={e => updateValue('ai_close_btn_container_size', e.target.value)}
              placeholder="28"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">আইকন সাইজ (px)</Label>
            <Input
              type="number"
              min={10}
              max={32}
              value={values.ai_close_btn_icon_size ?? '16'}
              onChange={e => updateValue('ai_close_btn_icon_size', e.target.value)}
              placeholder="16"
            />
          </div>
        </div>
        {/* Preview */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">প্রিভিউ:</span>
          <div
            className="rounded-full bg-primary/15 flex items-center justify-center"
            style={{
              width: `${values.ai_close_btn_container_size || 28}px`,
              height: `${values.ai_close_btn_container_size || 28}px`,
            }}
          >
            <ChevronDown
              style={{
                width: `${values.ai_close_btn_icon_size || 16}px`,
                height: `${values.ai_close_btn_icon_size || 16}px`,
              }}
              className="text-primary"
            />
          </div>
        </div>
      </div>

      {/* Chat Channels */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <h2 className="font-bold text-lg">💬 চ্যাট চ্যানেল লিঙ্ক</h2>
        <p className="text-xs text-muted-foreground">ফ্লোটিং বাটনে এই চ্যানেলগুলো দেখানো হবে। খালি রাখলে সেটি দেখাবে না।</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Facebook Messenger URL</Label>
            <Input
              value={values.chat_facebook_url || ''}
              onChange={e => updateValue('chat_facebook_url', e.target.value)}
              placeholder="https://m.me/yourpage"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Instagram DM URL</Label>
            <Input
              value={values.chat_instagram_url || ''}
              onChange={e => updateValue('chat_instagram_url', e.target.value)}
              placeholder="https://ig.me/m/yourpage"
            />
          </div>
        </div>
      </div>
    </SettingsPageWrapper>
  );
}
