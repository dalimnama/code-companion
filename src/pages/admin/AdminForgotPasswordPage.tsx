import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

const ALLOWED_ADMIN_EMAIL = 'dalim6663@gmail.com';

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (email.toLowerCase().trim() !== ALLOWED_ADMIN_EMAIL) {
      setError('এই ইমেইলে পাসওয়ার্ড রিসেট করা যাবে না');
      return;
    }

    setSubmitting(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);

    if (err) {
      setError('কিছু ভুল হয়েছে। আবার চেষ্টা করুন।');
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">পাসওয়ার্ড রিসেট</h1>
          <p className="text-sm text-muted-foreground mt-1">অ্যাডমিন পাসওয়ার্ড রিসেট করুন</p>
        </div>

        {sent ? (
          <div className="flex items-start gap-3 text-sm text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 p-4 rounded-lg">
            <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
            <p>পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে। ইমেইল চেক করুন।</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">অ্যাডমিন ইমেইল</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="আপনার মেইল লিখুন"
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'পাঠানো হচ্ছে...' : 'রিসেট লিংক পাঠান'}
            </Button>
            <p className="text-sm text-center">
              <Link to="/admin/login" className="text-primary hover:underline">
                লগইনে ফিরে যান
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
