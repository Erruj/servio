import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/AuthProvider';

type Row = {
  job_name: string; schedule: string; active: boolean;
  last_run_at: string | null; last_success_at: string | null;
  last_error_at: string | null; last_error: string | null;
};

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString('nl-NL') : '—');

/** Systeemstatus van de achtergrondtaken; alleen zichtbaar voor de Servio-beheerder. */
export function CronHealthCard() {
  const { user } = useAuth();
  const isOwner = user?.email?.toLowerCase() === 'info@getservio.co';
  const { data, isLoading, error } = useQuery({
    queryKey: ['cron-health', user?.id],
    enabled: isOwner,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_cron_health');
      if (error) throw error;
      return data as Row[];
    },
  });
  if (!isOwner) return null;

  return (
    <Card className="rounded-2xl">
      <CardHeader><CardTitle className="text-base">Systeemstatus achtergrondtaken</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        {isLoading && <Skeleton className="h-24 w-full" />}
        {error && <p className="text-destructive">Systeemstatus kon niet worden geladen: {(error as Error).message}</p>}
        {data?.map((r) => (
          <div key={r.job_name} className="rounded-xl bg-muted/50 p-3">
            <p className="font-medium">{r.job_name} <span className="text-muted-foreground">({r.schedule}{r.active ? '' : ', uit'})</span></p>
            <p className="text-muted-foreground">Laatst gestart: {fmt(r.last_run_at)} · Laatst gelukt: {fmt(r.last_success_at)}</p>
            {r.last_error_at && (!r.last_success_at || r.last_error_at > r.last_success_at) && (
              <p className="text-destructive">Laatste fout ({fmt(r.last_error_at)}): {r.last_error}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
