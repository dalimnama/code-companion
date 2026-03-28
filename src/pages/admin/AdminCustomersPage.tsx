import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { format } from 'date-fns';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export default function AdminCustomersPage() {
  const { data: profiles, isLoading } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <AdminPageHeader>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            কাস্টমার
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            মোট কাস্টমার: {profiles?.length ?? 0}
          </p>
        </div>
      </AdminPageHeader>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : !profiles?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          কোনো কাস্টমার নেই
        </div>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>নাম</TableHead>
                <TableHead>ফোন</TableHead>
                <TableHead>ইমেইল</TableHead>
                <TableHead>তারিখ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {p.full_name || <span className="text-muted-foreground italic">—</span>}
                  </TableCell>
                  <TableCell>{p.phone || '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{p.email || '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(p.created_at), 'dd MMM yyyy')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
