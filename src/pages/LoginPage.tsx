import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '@/hooks/use-customer-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { ShopLayout } from '@/components/layout/ShopLayout';
import { useLanguageStore } from '@/stores/language-store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useCustomerAuth();
  const navigate = useNavigate();
  const { language } = useLanguageStore();
  const bn = language === 'bn';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error: authError } = await signIn(email, password);
    if (authError) {
      setError(bn ? 'ইমেইল বা পাসওয়ার্ড ভুল হয়েছে' : 'Invalid email or password');
      setSubmitting(false);
      return;
    }
    navigate('/');
  };

  return (
    <ShopLayout>
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">
            {bn ? 'লগইন' : 'Login'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="flex flex-col gap-2">
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                {bn ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password?'}
              </Link>
              <p className="text-sm text-muted-foreground">
                {bn ? 'নতুন ইউজার?' : 'New user?'}{' '}
                <Link to="/register" className="text-primary hover:underline font-medium">
                  {bn ? 'রেজিস্টার করুন' : 'Register here'}
                </Link>
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (bn ? 'লগইন হচ্ছে...' : 'Logging in...') : (bn ? 'লগইন' : 'Login')}
            </Button>
          </form>
        </div>
      </div>
    </ShopLayout>
  );
}
