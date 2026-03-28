import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCustomerAuth } from '@/hooks/use-customer-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { ShopLayout } from '@/components/layout/ShopLayout';
import { useLanguageStore } from '@/stores/language-store';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { resetPassword } = useCustomerAuth();
  const { language } = useLanguageStore();
  const bn = language === 'bn';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error: err } = await resetPassword(email);
    setSubmitting(false);
    if (err) {
      setError(bn ? 'কিছু ভুল হয়েছে। আবার চেষ্টা করুন।' : 'Something went wrong. Please try again.');
      return;
    }
    setSent(true);
  };

  return (
    <ShopLayout>
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {bn ? 'পাসওয়ার্ড রিসেট' : 'Reset Password'}
          </h1>

          {sent ? (
            <div className="flex items-start gap-3 mt-4 text-sm text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 p-4 rounded-lg">
              <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
              <p>
                {bn
                  ? 'পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে। ইমেইল চেক করুন।'
                  : 'A password reset link has been sent to your email. Please check your inbox.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{bn ? 'ইমেইল' : 'Email'}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (bn ? 'পাঠানো হচ্ছে...' : 'Sending...') : (bn ? 'রিসেট লিংক পাঠান' : 'Send Reset Link')}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                <Link to="/login" className="text-primary hover:underline">
                  {bn ? 'লগইনে ফিরে যান' : 'Back to Login'}
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </ShopLayout>
  );
}
