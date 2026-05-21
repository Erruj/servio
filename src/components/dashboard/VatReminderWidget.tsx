import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { differenceInDays, format } from 'date-fns';
import { nl } from 'date-fns/locale';

// Bereken volgende BTW deadline (NL: maand na einde kwartaal, dag laatste van die maand)
function getNextVatDeadline(now = new Date()) {
  const quarter = Math.floor(now.getMonth() / 3); // 0..3
  const endMonth = quarter * 3 + 2; // 2, 5, 8, 11
  // Deadline = laatste dag van de maand NA het einde van het kwartaal
  const deadlineMonth = endMonth + 1; // 3, 6, 9, 12
  let year = now.getFullYear();
  let m = deadlineMonth;
  if (m > 11) { m = m - 12; year += 1; }
  const deadline = new Date(year, m + 1, 0); // laatste dag van maand m
  if (deadline < now) {
    // schuif door naar volgend kwartaal
    return getNextVatDeadline(new Date(year, m + 1, 1));
  }
  return { deadline, quarter: quarter + 1, year: now.getFullYear() };
}

export const VatReminderWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vatBalance, setVatBalance] = useState<{ collected: number; paid: number } | null>(null);

  const { deadline, quarter, year } = useMemo(() => getNextVatDeadline(), []);
  const daysLeft = differenceInDays(deadline, new Date());

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const qStart = new Date(year, (quarter - 1) * 3, 1).toISOString().slice(0, 10);
      const qEnd = new Date(year, quarter * 3, 0).toISOString().slice(0, 10);
      const [inv, rec] = await Promise.all([
        supabase.from('invoices').select('vat_amount').eq('user_id', user.id)
          .gte('invoice_date', qStart).lte('invoice_date', qEnd),
        supabase.from('receipts').select('amount').eq('user_id', user.id)
          .gte('receipt_date', qStart).lte('receipt_date', qEnd),
      ]);
      const paid = (inv.data || []).reduce((s, r: any) => s + (Number(r.vat_amount) || 0), 0);
      const collected = (rec.data || []).reduce((s, r: any) => s + (Number(r.amount) || 0) * 0.21 / 1.21, 0);
      setVatBalance({ collected, paid });
    };
    load();
  }, [user, quarter, year]);

  const urgent = daysLeft <= 14;
  const balance = vatBalance ? vatBalance.collected - vatBalance.paid : 0;

  return (
    <Card className={`shadow-card ${urgent ? 'border-warning/40' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            {urgent ? <AlertTriangle className="h-5 w-5 text-warning" /> : <Calendar className="h-5 w-5 text-primary" />}
            BTW Kwartaal {quarter} – {year}
          </span>
          <Badge variant={urgent ? 'destructive' : 'secondary'}>
            {daysLeft > 0 ? `Nog ${daysLeft} dagen` : 'Vandaag!'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Deadline aangifte</span>
          <span className="font-medium">{format(deadline, 'd MMMM yyyy', { locale: nl })}</span>
        </div>
        {vatBalance && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Geschatte te betalen BTW</span>
            <span className="font-semibold text-foreground">
              € {balance.toFixed(2)}
            </span>
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="default" onClick={() => navigate('/administration/exports')} className="flex-1">
            <CheckCircle2 className="h-4 w-4 mr-1" /> Genereer BTW rapport
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
