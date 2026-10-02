import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

export interface DashboardStatsRpc {
  total_emails: number;
  unread_emails: number;
  today_emails: number;
  week_emails: number;
  month_emails: number;
  total_invoices: number;
  total_receipts: number;
  total_documents: number;
  connections: number;
  read_emails_this_month: number;
  read_emails_last_month: number;
  invoices_this_month: number;
  invoices_last_month: number;
  ai_this_month: number;
  ai_last_month: number;
}

/** Alle dashboard-tellingen in één RPC-call, gedeeld tussen widgets via één query-key. */
export function useDashboardStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['dashboard-stats', user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_dashboard_stats');
      if (error) throw new Error(`Dashboardcijfers konden niet worden geladen: ${error.message}`);
      return data as DashboardStatsRpc;
    },
  });
}
