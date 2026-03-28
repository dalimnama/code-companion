import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';

interface Props {
  title: string;
  onSave: () => void;
  isSaving: boolean;
  children: ReactNode;
}

export function SettingsPageWrapper({ title, onSave, isSaving, children }: Props) {
  return (
    <div className="space-y-6">
      <div className="sticky top-[53px] lg:top-0 z-20 bg-muted/80 backdrop-blur-md py-3 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 -mt-4 md:-mt-6 lg:-mt-8 mb-2 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin/settings" className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors bg-card">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl font-bold">{title}</h1>
          </div>
          <Button onClick={onSave} disabled={isSaving} size="sm">
            <Save className="h-4 w-4 mr-2" /> {isSaving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}
