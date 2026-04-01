import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Archive, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminBreadcrumb } from '@/components/AdminBreadcrumb';

export default function Exports() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<string | null>(null);
  const [period, setPeriod] = useState('month');
  const [format, setFormat] = useState('csv');

  const exportData = async (type: string) => {
    setLoading(type);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let queryTable = '';
      let filename = '';

      switch (type) {
        case 'transactions': queryTable = 'transactions'; filename = 'transactions'; break;
        case 'invoices': queryTable = 'invoices'; filename = 'invoices'; break;
        case 'receipts': queryTable = 'receipts'; filename = 'receipts'; break;
        case 'documents': queryTable = 'documents'; filename = 'documents'; break;
        default: return;
      }

      const now = new Date();
      let startDate: Date | null = null;

      if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (period === 'quarter') {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
      } else if (period === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1);
      }

      let query = supabase.from(queryTable as any).select('*').eq('user_id', user.id);
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        toast.info('Geen data gevonden voor de geselecteerde periode.');
        return;
      }

      if (format === 'csv') {
        const csv = convertToCSV(data);
        downloadFile(csv, `${filename}_${period}.csv`, 'text/csv');
      } else if (format === 'json') {
        const json = JSON.stringify(data, null, 2);
        downloadFile(json, `${filename}_${period}.json`, 'application/json');
      } else if (format === 'pdf') {
        const pdfContent = generatePDFContent(data, filename);
        downloadFile(pdfContent, `${filename}_${period}.html`, 'text/html');
        toast.info('PDF-export is geopend als printbare HTML. Gebruik Ctrl+P om als PDF op te slaan.');
      }

      toast.success(`${filename} geëxporteerd als ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export mislukt. Probeer het opnieuw.');
    } finally {
      setLoading(null);
    }
  };

  const convertToCSV = (data: any[]) => {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        const escaped = ('' + (val ?? '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
  };

  const generatePDFContent = (data: any[], title: string) => {
    if (!data || data.length === 0) return '<html><body><p>Geen data</p></body></html>';
    const headers = Object.keys(data[0]);
    const headerRow = headers.map(h => `<th style="border:1px solid #ddd;padding:8px;background:#f5f5f5;text-align:left">${h}</th>`).join('');
    const rows = data.map(row => {
      const cells = headers.map(h => `<td style="border:1px solid #ddd;padding:8px">${row[h] ?? ''}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    return `<!DOCTYPE html><html><head><title>${title} Export - Servio</title>
    <style>body{font-family:Arial,sans-serif;margin:40px}h1{color:#333}table{border-collapse:collapse;width:100%;margin-top:20px}
    @media print{body{margin:10px}}</style></head>
    <body><h1>📊 ${title} Export</h1><p>Geëxporteerd op ${new Date().toLocaleDateString('nl-NL')} — Servio</p>
    <table><thead><tr>${headerRow}</tr></thead><tbody>${rows}</tbody></table></body></html>`;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    if (mimeType === 'text/html') {
      const win = window.open('', '_blank');
      if (win) { win.document.write(content); win.document.close(); }
      return;
    }
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportTypes = [
    { id: 'transactions', name: t('transactions'), icon: FileText },
    { id: 'invoices', name: t('invoices'), icon: FileText },
    { id: 'receipts', name: t('receipts'), icon: FileText },
    { id: 'documents', name: t('documents'), icon: Archive },
  ];

  return (
    <div className="space-y-6 p-6">
      <AdminBreadcrumb currentPage="Exports" />
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('exports')}</h1>
        <p className="text-muted-foreground">{t('exportsDescription')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('period')}</CardTitle>
            <CardDescription>{t('selectPeriod')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="month">{t('thisMonth')}</SelectItem>
                <SelectItem value="quarter">{t('thisQuarter')}</SelectItem>
                <SelectItem value="year">{t('thisYear')}</SelectItem>
                <SelectItem value="all">{t('allTime')}</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('format')}</CardTitle>
            <CardDescription>{t('selectFormat')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="pdf">PDF (print)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('exportData')}</CardTitle>
          <CardDescription>{t('selectDataToExport')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {exportTypes.map((type) => (
            <Button
              key={type.id}
              onClick={() => exportData(type.id)}
              disabled={loading !== null}
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2"
            >
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
