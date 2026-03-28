import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function AdminPageHeader({ children }: Props) {
  return (
    <div className="sticky top-[53px] lg:top-0 z-40 bg-muted/95 supports-[backdrop-filter]:bg-muted/85 backdrop-blur-md py-3 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 mb-4 border-b border-border/50 shadow-sm">
      {children}
    </div>
  );
}
