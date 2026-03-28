import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '@/hooks/use-customer-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShopLayout } from '@/components/layout/ShopLayout';
import { useLanguageStore } from '@/stores/language-store';
import { LogOut, User, Mail, Phone, MapPin, Pencil, Check, X, Camera, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const PRESET_AVATARS = [
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Aneka',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Liam',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Sophia',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Oliver',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Mia',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Noah',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Emma',
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Felix',
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Aneka',
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Liam',
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Sophia',
  'https://api.dicebear.com/9.x/thumbs/svg?seed=Felix',
  'https://api.dicebear.com/9.x/thumbs/svg?seed=Aneka',
  'https://api.dicebear.com/9.x/thumbs/svg?seed=Liam',
  'https://api.dicebear.com/9.x/thumbs/svg?seed=Sophia',
];

export default function AccountPage() {
  const { user, loading, signOut } = useCustomerAuth();
  const navigate = useNavigate();
  const { language } = useLanguageStore();
  const bn = language === 'bn';
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);

  const [form, setForm] = useState({ full_name: '', phone: '', address: '', avatar_url: '' });

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: (profile as any).address || '',
        avatar_url: (profile as any).avatar_url || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          avatar_url: form.avatar_url,
        } as any)
        .eq('user_id', user.id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      setEditing(false);
      toast.success(bn ? 'প্রোফাইল আপডেট হয়েছে' : 'Profile updated');
    } catch {
      toast.error(bn ? 'আপডেট ব্যর্থ হয়েছে' : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error(bn ? 'ফাইল সাইজ ২MB এর বেশি হতে পারবে না' : 'File size must be under 2MB');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;
      setForm(prev => ({ ...prev, avatar_url: urlWithCacheBust }));
      setAvatarDialogOpen(false);
      toast.success(bn ? 'ছবি আপলোড হয়েছে' : 'Photo uploaded');
    } catch {
      toast.error(bn ? 'আপলোড ব্যর্থ হয়েছে' : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const selectPresetAvatar = (url: string) => {
    setForm(prev => ({ ...prev, avatar_url: url }));
    setAvatarDialogOpen(false);
  };

  if (loading || !user) return <ShopLayout><div className="min-h-[60vh]" /></ShopLayout>;

  const avatarSrc = editing ? form.avatar_url : ((profile as any)?.avatar_url || form.avatar_url);

  return (
    <ShopLayout>
      <div className="min-h-[60vh] px-4 py-10 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{bn ? 'আমার অ্যাকাউন্ট' : 'My Account'}</h1>
          {!editing && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
              {bn ? 'এডিট' : 'Edit'}
            </Button>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="w-20 h-20 border-2 border-border">
                {avatarSrc ? (
                  <AvatarImage src={avatarSrc} alt="Avatar" />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              {editing && (
                <button
                  type="button"
                  onClick={() => setAvatarDialogOpen(true)}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:opacity-90 transition"
                >
                  <Camera className="h-4 w-4" />
                </button>
              )}
            </div>
            {!editing && (
              <div className="text-center">
                <p className="font-semibold text-lg">{profile?.full_name || user.email}</p>
                <p className="text-sm text-muted-foreground">{bn ? 'কাস্টমার' : 'Customer'}</p>
              </div>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <Label>{bn ? 'নাম' : 'Full Name'}</Label>
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder={bn ? 'আপনার নাম' : 'Your name'}
                />
              </div>
              <div>
                <Label>{bn ? 'মোবাইল নম্বর' : 'Phone'}</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <div>
                <Label>{bn ? 'ইমেইল' : 'Email'}</Label>
                <Input value={user.email || ''} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground mt-1">
                  {bn ? 'ইমেইল পরিবর্তন করা যাবে না' : 'Email cannot be changed'}
                </p>
              </div>
              <div>
                <Label>{bn ? 'ঠিকানা' : 'Address'}</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder={bn ? 'আপনার ঠিকানা' : 'Your address'}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {bn ? 'সেভ করুন' : 'Save'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    if (profile) {
                      setForm({
                        full_name: profile.full_name || '',
                        phone: profile.phone || '',
                        address: (profile as any).address || '',
                        avatar_url: (profile as any).avatar_url || '',
                      });
                    }
                  }}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  {bn ? 'বাতিল' : 'Cancel'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{user.email}</span>
                </div>
                {profile?.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {(profile as any)?.address && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{(profile as any).address}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={async () => {
                    await signOut();
                    navigate('/');
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  {bn ? 'লগআউট' : 'Logout'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Avatar Selection Dialog */}
      <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
        <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{bn ? 'অ্যাভাটার বাছাই করুন' : 'Choose Avatar'}</DialogTitle>
          </DialogHeader>

          {/* Upload own photo */}
          <div className="mb-4">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {bn ? 'নিজের ছবি আপলোড করুন' : 'Upload your photo'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <p className="text-xs text-muted-foreground mt-1 text-center">
              {bn ? 'সর্বোচ্চ ২MB' : 'Max 2MB'}
            </p>
          </div>

          {/* Preset avatars */}
          <div>
            <p className="text-sm font-medium mb-3">{bn ? 'অথবা একটি অ্যাভাটার বাছাই করুন' : 'Or pick an avatar'}</p>
            <div className="grid grid-cols-4 gap-3">
              {PRESET_AVATARS.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectPresetAvatar(url)}
                  className={`rounded-full border-2 overflow-hidden transition hover:scale-105 ${
                    form.avatar_url === url ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                  }`}
                >
                  <img src={url} alt={`Avatar ${i + 1}`} className="w-full h-full" />
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ShopLayout>
  );
}
