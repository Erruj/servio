import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Archive, Loader2, FileSpreadsheet, Calculator, Clock, FilePlus2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminBreadcrumb } from '@/components/AdminBreadcrumb';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

type Period = 'month' | 'quarter' | 'year' | 'all';
type Format = 'csv' | 'xlsx' | 'pdf' | 'json';

export default function Exports() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('month');
  const [format, setFormat] = useState<Format>('xlsx');

  const getRange = (p: Period) => {
    const now = new Date();
    if (p === 'month') return { start: new Date(now.getFullYear(), now.getMonth(), 1), label: now.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' }) };
    if (p === 'quarter') {
      const q = Math.floor(now.getMonth() / 3);
      return { start: new Date(now.getFullYear(), q * 3, 1), label: `Q${q + 1} ${now.getFullYear()}` };
    }
    if (p === 'year') return { start: new Date(now.getFullYear(), 0, 1), label: `${now.getFullYear()}` };
    return { start: null as Date | null, label: 'Alles' };
  };

  const fetchTable = async (table: string, userId: string, start: Date | null, dateCol = 'created_at') => {
    let q = supabase.from(table as any).select('*').eq('user_id', userId);
    if (start) q = q.gte(dateCol, start.toISOString());
    const { data, error } = await q;
    if (error) throw error;
    return (data as any[]) || [];
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toCSV = (rows: any[]) => {
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
  };

  const buildPDF = (title: string, subtitle: string, headers: string[], body: any[][], summary?: { label: string; value: string }[]) => {
    const doc = new jsPDF({ orientation: headers.length > 6 ? 'landscape' : 'portrait' });
    doc.setFontSize(16);
    doc.text(title, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`${subtitle} — Servio — ${new Date().toLocaleDateString('nl-NL')}`, 14, 25);
    doc.setTextColor(0);
    let startY = 32;
    if (summary && summary.length) {
      autoTable(doc, {
        startY,
        head: [['Overzicht', 'Waarde']],
        body: summary.map(s => [s.label, s.value]),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 10 },
      });
      startY = (doc as any).lastAutoTable.finalY + 6;
    }
    autoTable(doc, {
      startY,
      head: [headers],
      body,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8, cellPadding: 2 },
    });
    return doc.output('blob');
  };

  const exportGeneric = async (type: string) => {
    setLoading(type);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');

      const { start, label } = getRange(period);
      const rows = await fetchTable(type, user.id, start);
      if (!rows.length) {
        toast.info('Geen data gevonden voor de geselecteerde periode.');
        return;
      }

      const filename = `${type}_${label.replace(/\s+/g, '_')}`;

      if (format === 'csv') {
        triggerDownload(new Blob([toCSV(rows)], { type: 'text/csv' }), `${filename}.csv`);
      } else if (format === 'json') {
        triggerDownload(new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }), `${filename}.json`);
      } else if (format === 'xlsx') {
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, type.slice(0, 31));
        const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        triggerDownload(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${filename}.xlsx`);
      } else if (format === 'pdf') {
        const headers = Object.keys(rows[0]).slice(0, 8);
        const body = rows.map(r => headers.map(h => String(r[h] ?? '').slice(0, 60)));
        const blob = buildPDF(`${type.charAt(0).toUpperCase() + type.slice(1)} export`, `Periode: ${label}`, headers, body);
        triggerDownload(blob, `${filename}.pdf`);
      }

      toast.success(`${type} geëxporteerd (${format.toUpperCase()})`);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Export mislukt');
    } finally {
      setLoading(null);
    }
  };

  // Year overview: combined invoices, receipts, transactions, time
  const exportYearOverview = async () => {
    setLoading('year-overview');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');
      const year = new Date().getFullYear();
      const start = new Date(year, 0, 1);

      const [invoices, receipts, transactions, timeEntries] = await Promise.all([
        fetchTable('invoices', user.id, start, 'invoice_date'),
        fetchTable('receipts', user.id, start, 'receipt_date'),
        fetchTable('transactions', user.id, start, 'date'),
        fetchTable('time_entries', user.id, start, 'start_time'),
      ]);

      const sum = (arr: any[], k: string) => arr.reduce((s, r) => s + (Number(r[k]) || 0), 0);
      const totalRevenue = sum(transactions.filter((t: any) => t.type === 'income'), 'amount');
      const totalCosts = sum(transactions.filter((t: any) => t.type === 'expense'), 'amount') + sum(receipts, 'amount');
      const totalInvoiced = sum(invoices, 'amount');
      const totalHours = sum(timeEntries, 'duration_minutes') / 60;

      const summary = [
        { label: 'Jaar', value: String(year) },
        { label: 'Totaal omzet', value: `€ ${totalRevenue.toFixed(2)}` },
        { label: 'Totaal kosten', value: `€ ${totalCosts.toFixed(2)}` },
        { label: 'Resultaat', value: `€ ${(totalRevenue - totalCosts).toFixed(2)}` },
        { label: 'Facturen verstuurd', value: `${invoices.length} (€ ${totalInvoiced.toFixed(2)})` },
        { label: 'Bonnetjes', value: String(receipts.length) },
        { label: 'Gewerkte uren', value: totalHours.toFixed(1) },
      ];

      if (format === 'xlsx') {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary.map(s => ({ Overzicht: s.label, Waarde: s.value }))), 'Samenvatting');
        if (invoices.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invoices), 'Facturen');
        if (receipts.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(receipts), 'Bonnetjes');
        if (transactions.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(transactions), 'Transacties');
        if (timeEntries.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(timeEntries), 'Uren');
        const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        triggerDownload(new Blob([buf]), `jaaroverzicht_${year}.xlsx`);
      } else {
        const headers = ['Datum', 'Type', 'Omschrijving', 'Bedrag'];
        const body: any[][] = [
          ...invoices.map((i: any) => [i.invoice_date || i.created_at?.slice(0, 10), 'Factuur', i.supplier || i.invoice_number || '-', `€ ${Number(i.amount || 0).toFixed(2)}`]),
          ...receipts.map((r: any) => [r.receipt_date || r.created_at?.slice(0, 10), 'Bonnetje', r.merchant || '-', `€ ${Number(r.amount || 0).toFixed(2)}`]),
          ...transactions.map((t: any) => [t.date, t.type === 'income' ? 'Inkomst' : 'Uitgave', t.description || '-', `€ ${Number(t.amount || 0).toFixed(2)}`]),
        ].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
        const blob = buildPDF(`Jaaroverzicht ${year}`, 'Volledig financieel overzicht', headers, body, summary);
        triggerDownload(blob, `jaaroverzicht_${year}.pdf`);
      }
      toast.success(`Jaaroverzicht ${year} geëxporteerd`);
    } catch (e: any) {
      toast.error(e.message || 'Export mislukt');
    } finally {
      setLoading(null);
    }
  };

  // VAT report (BTW per kwartaal)
  const exportVAT = async () => {
    setLoading('vat');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');
      const { start, label } = getRange(period === 'month' ? 'quarter' : period);
      const invoices = await fetchTable('invoices', user.id, start, 'invoice_date');
      const receipts = await fetchTable('receipts', user.id, start, 'receipt_date');

      const outVat = invoices.reduce((s: number, r: any) => s + (Number(r.vat_amount) || 0), 0);
      const outAmount = invoices.reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
      // For receipts assume 21% if no field
      const inVat = receipts.reduce((s: number, r: any) => s + (Number(r.amount) || 0) * 0.21 / 1.21, 0);
      const toPay = outVat - inVat;

      const summary = [
        { label: 'Periode', value: label },
        { label: 'Omzet (excl. BTW)', value: `€ ${(outAmount - outVat).toFixed(2)}` },
        { label: 'BTW ontvangen (verkoop)', value: `€ ${outVat.toFixed(2)}` },
        { label: 'BTW betaald (inkoop, geschat)', value: `€ ${inVat.toFixed(2)}` },
        { label: 'Te betalen / terug te vorderen', value: `€ ${toPay.toFixed(2)}` },
      ];

      const headers = ['Datum', 'Type', 'Omschrijving', 'Bedrag', 'BTW'];
      const body = [
        ...invoices.map((i: any) => [i.invoice_date || '-', 'Verkoop', i.supplier || i.invoice_number || '-', `€ ${Number(i.amount || 0).toFixed(2)}`, `€ ${Number(i.vat_amount || 0).toFixed(2)}`]),
        ...receipts.map((r: any) => [r.receipt_date || '-', 'Inkoop', r.merchant || '-', `€ ${Number(r.amount || 0).toFixed(2)}`, `€ ${(Number(r.amount || 0) * 0.21 / 1.21).toFixed(2)}`]),
      ];

      if (format === 'xlsx') {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary.map(s => ({ Overzicht: s.label, Waarde: s.value }))), 'BTW-aangifte');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([headers, ...body]), 'Detail');
        const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        triggerDownload(new Blob([buf]), `btw_aangifte_${label.replace(/\s+/g, '_')}.xlsx`);
      } else {
        const blob = buildPDF('BTW-aangifte', `Periode: ${label}`, headers, body, summary);
        triggerDownload(blob, `btw_aangifte_${label.replace(/\s+/g, '_')}.pdf`);
      }
      toast.success('BTW-rapport gegenereerd');
    } catch (e: any) {
      toast.error(e.message || 'Export mislukt');
    } finally {
      setLoading(null);
    }
  };

  // Hours / time report
  const exportHours = async () => {
    setLoading('hours');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');
      const { start, label } = getRange(period);
      const entries = await fetchTable('time_entries', user.id, start, 'start_time');

      const totalHours = entries.reduce((s: number, e: any) => s + (Number(e.duration_minutes) || 0), 0) / 60;
      const billableHours = entries.filter((e: any) => e.billable).reduce((s: number, e: any) => s + (Number(e.duration_minutes) || 0), 0) / 60;
      const revenue = entries.reduce((s: number, e: any) => s + ((Number(e.duration_minutes) || 0) / 60) * (Number(e.hourly_rate) || 0), 0);

      const summary = [
        { label: 'Periode', value: label },
        { label: 'Aantal regels', value: String(entries.length) },
        { label: 'Totaal uren', value: totalHours.toFixed(2) },
        { label: 'Factureerbare uren', value: billableHours.toFixed(2) },
        { label: 'Geschatte omzet', value: `€ ${revenue.toFixed(2)}` },
      ];
      const headers = ['Datum', 'Project', 'Omschrijving', 'Uren', 'Tarief', 'Bedrag'];
      const body = entries.map((e: any) => {
        const h = (Number(e.duration_minutes) || 0) / 60;
        const rate = Number(e.hourly_rate) || 0;
        return [
          e.start_time?.slice(0, 10) || '-',
          e.project || '-',
          e.description || '-',
          h.toFixed(2),
          `€ ${rate.toFixed(2)}`,
          `€ ${(h * rate).toFixed(2)}`,
        ];
      });

      if (format === 'xlsx') {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary.map(s => ({ Overzicht: s.label, Waarde: s.value }))), 'Samenvatting');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([headers, ...body]), 'Uren');
        const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        triggerDownload(new Blob([buf]), `urenrapport_${label.replace(/\s+/g, '_')}.xlsx`);
      } else {
        const blob = buildPDF('Urenrapport', `Periode: ${label}`, headers, body, summary);
        triggerDownload(blob, `urenrapport_${label.replace(/\s+/g, '_')}.pdf`);
      }
      toast.success('Urenrapport gegenereerd');
    } catch (e: any) {
      toast.error(e.message || 'Export mislukt');
    } finally {
      setLoading(null);
    }
  };

  // ZIP: alles in één bestand
  const exportAllZip = async () => {
    setLoading('zip');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');
      const { start, label } = getRange(period);
      const tables = ['invoices', 'receipts', 'transactions', 'time_entries', 'documents', 'customers'];
      const zip = new JSZip();
      for (const t of tables) {
        const rows = await fetchTable(t, user.id, start);
        if (!rows.length) continue;
        zip.file(`${t}.csv`, toCSV(rows));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, t.slice(0, 31));
        const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        zip.file(`${t}.xlsx`, buf);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      triggerDownload(blob, `servio_export_${label.replace(/\s+/g, '_')}.zip`);
      toast.success('ZIP-export klaar');
    } catch (e: any) {
      toast.error(e.message || 'Export mislukt');
    } finally {
      setLoading(null);
    }
  };

  const dataTypes = [
    { id: 'transactions', name: 'Transacties', icon: FileText },
    { id: 'invoices', name: 'Facturen', icon: FileText },
    { id: 'receipts', name: 'Bonnetjes', icon: FileText },
    { id: 'documents', name: 'Documenten', icon: Archive },
  ];

  const reports = [
    { id: 'year-overview', name: 'Jaaroverzicht', desc: 'Volledig financieel overzicht van dit jaar', icon: FilePlus2, action: exportYearOverview },
    { id: 'vat', name: 'BTW-aangifte', desc: 'Verkoop- en inkoop-BTW per periode', icon: Calculator, action: exportVAT },
    { id: 'hours', name: 'Urenrapport', desc: 'Gewerkte uren, factureerbaar en omzet', icon: Clock, action: exportHours },
    { id: 'zip', name: 'Alles in ZIP', desc: 'Alle tabellen als CSV + Excel in één ZIP', icon: Archive, action: exportAllZip },
  ];

  return (
    <div className="space-y-6 p-6">
      <AdminBreadcrumb currentPage="Exports" />
      <div>
        <h1 className="text-3xl font-bold text-foreground">Exports & Rapporten</h1>
        <p className="text-muted-foreground">Download je data of genereer een professioneel rapport.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Periode</CardTitle><CardDescription>Welke periode wil je exporteren?</CardDescription></CardHeader>
          <CardContent>
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Deze maand</SelectItem>
                <SelectItem value="quarter">Dit kwartaal</SelectItem>
                <SelectItem value="year">Dit jaar</SelectItem>
                <SelectItem value="all">Alles</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Formaat</CardTitle><CardDescription>Geldt voor data-export en rapporten</CardDescription></CardHeader>
          <CardContent>
            <Select value={format} onValueChange={(v) => setFormat(v as Format)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" /> Rapporten</CardTitle>
          <CardDescription>Kant-en-klare rapporten met samenvatting</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {reports.map(r => (
            <Button key={r.id} onClick={r.action} disabled={loading !== null} variant="outline" className="h-auto py-4 flex flex-col items-start gap-2 text-left">
              <div className="flex items-center gap-2 w-full">
                {loading === r.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <r.icon className="h-5 w-5 text-primary" />}
                <span className="font-semibold">{r.name}</span>
                <Download className="h-4 w-4 ml-auto" />
              </div>
              <span className="text-xs text-muted-foreground font-normal">{r.desc}</span>
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ruwe data export</CardTitle><CardDescription>Exporteer een specifieke tabel</CardDescription></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {dataTypes.map((type) => (
            <Button key={type.id} onClick={() => exportGeneric(type.id)} disabled={loading !== null} variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
              {loading === type.id ? <Loader2 className="h-6 w-6 animate-spin" /> : <type.icon className="h-6 w-6" />}
              <span>{type.name}</span>
              <Download className="h-4 w-4" />
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
