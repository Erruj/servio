// Maandelijkse auto-export voor alle gebruikers met auto_export_enabled = true
// Genereert een ZIP met CSV bestanden (facturen, bonnetjes, transacties, uren) per gebruiker
// en upload deze naar storage bucket 'financial-documents' onder {user_id}/auto-exports/{YYYY-MM}.zip
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import JSZip from 'npm:jszip@3.10.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function toCsv(rows: any[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = String(v).replace(/"/g, '""');
    return /[;"\n\r]/.test(s) ? `"${s}"` : s;
  };
  return [headers.join(';'), ...rows.map(r => headers.map(h => escape(r[h])).join(';'))].join('\n');
}

async function exportForUser(admin: any, userId: string, period: { start: string; end: string; label: string }) {
  const zip = new JSZip();

  const [invoices, receipts, transactions, timeEntries] = await Promise.all([
    admin.from('invoices').select('invoice_number,supplier,invoice_date,due_date,amount,vat_amount,category,status')
      .eq('user_id', userId).gte('invoice_date', period.start).lte('invoice_date', period.end),
    admin.from('receipts').select('merchant,receipt_date,amount,category,status')
      .eq('user_id', userId).gte('receipt_date', period.start).lte('receipt_date', period.end),
    admin.from('transactions').select('date,description,amount,category,type')
      .eq('user_id', userId).gte('date', period.start).lte('date', period.end),
    admin.from('time_entries').select('start_time,end_time,duration_minutes,project,description,hourly_rate,billable,invoiced')
      .eq('user_id', userId).gte('start_time', period.start).lte('start_time', period.end),
  ]);

  zip.file(`facturen-${period.label}.csv`, toCsv(invoices.data || []));
  zip.file(`bonnetjes-${period.label}.csv`, toCsv(receipts.data || []));
  zip.file(`transacties-${period.label}.csv`, toCsv(transactions.data || []));
  zip.file(`uren-${period.label}.csv`, toCsv(timeEntries.data || []));

    // BTW samenvatting
    const vatCollected = (invoices.data || []).reduce((s: number, r: any) => s + (Number(r.vat_amount) || 0), 0);
    const vatPaidEstimate = (receipts.data || []).reduce((s: number, r: any) => s + (Number(r.amount) || 0) * 0.21 / 1.21, 0);
    const summary = `Periode;${period.label}\nFacturen;${invoices.data?.length || 0}\nBonnetjes;${receipts.data?.length || 0}\nBTW geïnd (uitgaand);${vatCollected.toFixed(2)}\nBTW betaald (geschat, inkomend);${vatPaidEstimate.toFixed(2)}\nSaldo te betalen;${(vatCollected - vatPaidEstimate).toFixed(2)}\n`;
    zip.file(`samenvatting-${period.label}.csv`, summary);

  const blob = await zip.generateAsync({ type: 'uint8array' });
  const path = `${userId}/auto-exports/${period.label}.zip`;
  const { error } = await admin.storage.from('financial-documents').upload(path, blob, {
    contentType: 'application/zip',
    upsert: true,
  });
  if (error) throw error;
  return path;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const CRON_SECRET = Deno.env.get('CRON_SECRET');
    const cronHeader = req.headers.get('x-cron-secret');
    const authHeader = req.headers.get('Authorization');
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

    // AuthZ: either a valid cron secret (server-to-server) OR an authenticated user
    // (who can only export their own data)
    let callerUserId: string | null = null;
    const isCron = !!CRON_SECRET && cronHeader === CRON_SECRET;

    if (!isCron) {
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Niet geautoriseerd' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const anon = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!);
      const { data: { user }, error: uErr } = await anon.auth.getUser(authHeader.replace('Bearer ', ''));
      if (uErr || !user) {
        return new Response(JSON.stringify({ error: 'Ongeldig token' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      callerUserId = user.id;
    }

    // Bepaal vorige maand
    const now = new Date();
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthEnd = new Date(firstOfThisMonth.getTime() - 1);
    const lastMonthStart = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), 1);
    const label = `${lastMonthStart.getFullYear()}-${String(lastMonthStart.getMonth() + 1).padStart(2, '0')}`;
    const period = {
      start: lastMonthStart.toISOString().slice(0, 10),
      end: lastMonthEnd.toISOString().slice(0, 10),
      label,
    };

    // Determine target users
    let targetUsers: string[] = [];
    if (callerUserId) {
      // Authenticated user can only export their own data — ignore any body.userId
      targetUsers = [callerUserId];
    } else {
      // Cron path: optional body.userId to target one user, else all opted-in users
      if (req.method === 'POST') {
        const body = await req.json().catch(() => ({}));
        if (body?.userId && typeof body.userId === 'string') targetUsers = [body.userId];
      }
      if (targetUsers.length === 0) {
        const { data } = await admin.from('user_settings').select('user_id').eq('auto_export_enabled', true);
        targetUsers = (data || []).map((r: any) => r.user_id);
      }
    }


    const results: Array<{ userId: string; ok: boolean; path?: string; error?: string }> = [];
    for (const uid of targetUsers) {
      try {
        const path = await exportForUser(admin, uid, period);
        results.push({ userId: uid, ok: true, path });
      } catch (e: any) {
        results.push({ userId: uid, ok: false, error: e.message });
      }
    }

    return new Response(JSON.stringify({ period: label, count: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('auto-export error', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
