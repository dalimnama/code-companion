import { useState, useEffect, forwardRef } from 'react';
import { useLanguageStore } from '@/stores/language-store';
import { Flame } from 'lucide-react';

interface CountdownTimerProps {
  endDate: string;
}

export const CountdownTimer = forwardRef<HTMLDivElement, CountdownTimerProps>(function CountdownTimer({ endDate }, ref) {
  const { t } = useLanguageStore();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  const pad = (n: number) => n.toString().padStart(2, '0');

  const units = [
    { value: timeLeft.days, label: 'দিন' },
    { value: timeLeft.hours, label: 'ঘণ্টা' },
    { value: timeLeft.minutes, label: 'মিনিট' },
    { value: timeLeft.seconds, label: 'সেকেন্ড' },
  ];

  return (
    <div ref={ref} className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5 text-sale">
        <Flame className="h-4 w-4 animate-pulse" />
        <span className="text-sm font-bold">{t('endsIn')}</span>
      </div>
      <div className="flex gap-2">
        {units.map((unit, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="bg-foreground text-background rounded-lg px-2.5 py-1.5 min-w-[44px] text-center shadow-md">
              <span className="text-base font-bold font-mono tracking-wider">{pad(unit.value)}</span>
            </div>
            <span className="text-[9px] text-muted-foreground mt-1 font-medium">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

CountdownTimer.displayName = 'CountdownTimer';
