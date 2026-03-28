import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '@/hooks/use-customer-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { ShopLayout } from '@/components/layout/ShopLayout';
import { useLanguageStore } from '@/stores/language-store';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signUp } = useCustomerAuth();
  const navigate = useNavigate();
  const { language } = useLanguageStore();
  const bn = language === 'bn';

  const BLOCKED_DOMAINS = [
    'tempmail.com','temp-mail.org','guerrillamail.com','guerrillamail.net','guerrillamail.org',
    'mailinator.com','throwaway.email','yopmail.com','yopmail.fr','sharklasers.com',
    'guerrillamailblock.com','grr.la','dispostable.com','maildrop.cc','fakeinbox.com',
    'trashmail.com','trashmail.me','trashmail.net','10minutemail.com','10minutemail.net',
    'minutemail.com','tempail.com','tempr.email','discard.email','discardmail.com',
    'mailnesia.com','mailcatch.com','binkmail.com','spamavert.com','spamfree24.org',
    'mytemp.email','mohmal.com','getnada.com','emailondeck.com','33mail.com',
    'mailtothis.com','mailsac.com','burnermail.io','inboxbear.com','tempinbox.com',
    'mailtemp.net','harakirimail.com','crazymailing.com','tmail.ws','trash-mail.com',
    'bugmenot.com','mailnull.com','spamgourmet.com','jetable.org','incognitomail.org',
    'mailexpire.com','safetymail.info','filzmail.com','tempomail.fr','emailfake.com',
    'generator.email','guerrillamail.de','mailforspam.com','tempmailaddress.com',
  ];

  const isBlockedEmail = (email: string) => {
    const domain = email.trim().toLowerCase().split('@')[1];
    if (!domain) return true;
    if (BLOCKED_DOMAINS.includes(domain)) return true;
    // Only allow common trusted providers
    const ALLOWED_DOMAINS = [
      'gmail.com','yahoo.com','yahoo.co.uk','outlook.com','hotmail.com','live.com',
      'icloud.com','me.com','mac.com','aol.com','protonmail.com','proton.me',
      'zoho.com','mail.com','gmx.com','gmx.net','yandex.com','fastmail.com',
    ];
    // Allow if it's a known provider OR has a custom domain (business email)
    if (ALLOWED_DOMAINS.includes(domain)) return false;
    // Block if domain looks suspicious (very short or numeric-heavy)
    if (domain.length < 5 || /^\d+/.test(domain.split('.')[0])) return true;
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isBlockedEmail(email)) {
      setError(bn ? 'টেম্পোরারি বা ভুয়া ইমেইল ব্যবহার করা যাবে না। Gmail, Yahoo, Outlook ইত্যাদি ব্যবহার করুন।' : 'Temporary or disposable emails are not allowed. Please use Gmail, Yahoo, Outlook, etc.');
      return;
    }

    if (password.length < 6) {
      setError(bn ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' : 'Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);

    try {
      const { error: authError } = await signUp(email.trim(), password, fullName.trim(), phone.trim());

      if (authError) {
        if (authError.message?.toLowerCase().includes('signups not allowed')) {
          setError(bn ? 'রেজিস্ট্রেশন সাময়িকভাবে বন্ধ আছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।' : 'Registration is temporarily disabled. Please try again later.');
        } else if (authError.message?.toLowerCase().includes('already registered')) {
          setError(bn ? 'এই ইমেইল দিয়ে আগে থেকেই অ্যাকাউন্ট আছে। লগইন করুন।' : 'An account already exists with this email. Please log in.');
        } else {
          setError(authError.message || (bn ? 'রেজিস্ট্রেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।' : 'Registration failed. Please try again.'));
        }
        return;
      }

      toast.success(bn ? 'অ্যাকাউন্ট তৈরি হয়েছে! ইমেইল ভেরিফাই করুন।' : 'Account created! Please verify your email.');
      navigate('/login');
    } catch {
      setError(bn ? 'নেটওয়ার্ক সমস্যা হয়েছে। আবার চেষ্টা করুন।' : 'A network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ShopLayout>
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">
            {bn ? 'নতুন অ্যাকাউন্ট' : 'New Account'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">{bn ? 'নাম' : 'Name'}</Label>
              <Input
                id="name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder={bn ? 'আপনার নাম' : 'Your name'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{bn ? 'ফোন নম্বর' : 'Phone Number'}</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="01XXXXXXXXX"
              />
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="password">{bn ? 'পাসওয়ার্ড' : 'Password'}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {bn ? 'ইতোমধ্যে অ্যাকাউন্ট আছে?' : 'Already have an account?'}{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                {bn ? 'লগইন করুন' : 'Login'}
              </Link>
            </p>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (bn ? 'তৈরি হচ্ছে...' : 'Creating...') : (bn ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account')}
            </Button>
          </form>
        </div>
      </div>
    </ShopLayout>
  );
}
