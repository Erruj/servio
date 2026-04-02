import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Play, Square, Plus, Clock, Timer, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminBreadcrumb } from '@/components/AdminBreadcrumb';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Customer { id: string; name: string; }
interface TimeEntry {
  id: string; customer_id: string | null; project: string | null; description: string | null;
  start_time: string; end_time: string | null; duration_minutes: number | null;
  hourly_rate: number | null; billable: boolean; invoiced: boolean; created_at: string;
}

export default function TimeTracking() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManual, setShowManual] = useState(false);
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer form
  const [timerProject, setTimerProject] = useState('');
  const [timerDesc, setTimerDesc] = useState('');
  const [timerCustomer, setTimerCustomer] = useState('');
  const [timerRate, setTimerRate] = useState('');

  // Manual form
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualHours, setManualHours] = useState('');
  const [manualMinutes, setManualMinutes] = useState('');
  const [manualProject, setManualProject] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualCustomer, setManualCustomer] = useState('');
  const [manualRate, setManualRate] = useState('');

  useEffect(() => { loadData(); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const [entriesRes, customersRes] = await Promise.all([
      supabase.from('time_entries').select('*').eq('user_id', user.user.id).order('start_time', { ascending: false }).limit(100),
      supabase.from('customers').select('id, name').eq('user_id', user.user.id).order('name'),
    ]);
    setEntries((entriesRes.data as any[]) || []);
    setCustomers((customersRes.data as any[]) || []);
    setLoading(false);
  };

  const startTimer = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data, error } = await supabase.from('time_entries').insert({
      user_id: user.user.id, customer_id: timerCustomer || null, project: timerProject || null,
      description: timerDesc || null, start_time: new Date().toISOString(),
      hourly_rate: timerRate ? Number(timerRate) : null, billable: true,
    }).select('id').single();
    if (error || !data) { toast.error('Fout bij starten timer'); return; }
    setActiveTimer(data.id);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    toast.success('Timer gestart');
  };

  const stopTimer = async () => {
    if (!activeTimer) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const durationMinutes = Math.round(elapsed / 60);
    await supabase.from('time_entries').update({
      end_time: new Date().toISOString(), duration_minutes: Math.max(1, durationMinutes),
    }).eq('id', activeTimer);
    setActiveTimer(null);
    setElapsed(0);
    setTimerProject(''); setTimerDesc(''); setTimerCustomer(''); setTimerRate('');
    toast.success('Timer gestopt');
    loadData();
  };

  const handleManualSave = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const totalMinutes = (Number(manualHours) || 0) * 60 + (Number(manualMinutes) || 0);
    if (totalMinutes <= 0) { toast.error('Voer uren of minuten in'); return; }
    const startTime = new Date(`${manualDate}T09:00:00`);
    const endTime = new Date(startTime.getTime() + totalMinutes * 60000);
    const { error } = await supabase.from('time_entries').insert({
      user_id: user.user.id, customer_id: manualCustomer || null, project: manualProject || null,
      description: manualDesc || null, start_time: startTime.toISOString(), end_time: endTime.toISOString(),
      duration_minutes: totalMinutes, hourly_rate: manualRate ? Number(manualRate) : null, billable: true,
    });
    if (error) { toast.error('Fout bij opslaan'); return; }
    toast.success('Uren geregistreerd');
    setShowManual(false);
    setManualHours(''); setManualMinutes(''); setManualProject(''); setManualDesc(''); setManualCustomer(''); setManualRate('');
    loadData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('time_entries').delete().eq('id', id);
    toast.success('Verwijderd');
    loadData();
  };

  const handleExportCSV = () => {
    const headers = ['Datum', 'Project', 'Omschrijving', 'Uren', 'Uurtarief', 'Totaal'];
    const rows = entries.map(e => [
      format(new Date(e.start_time), 'dd-MM-yyyy'),
      e.project || '', e.description || '',
      ((e.duration_minutes || 0) / 60).toFixed(2),
      e.hourly_rate || '', e.hourly_rate && e.duration_minutes ? ((e.duration_minutes / 60) * e.hourly_rate).toFixed(2) : '',
    ]);
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'uren-export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600); const m = Math.floor((seconds % 3600) / 60); const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalHours = entries.reduce((a, e) => a + (e.duration_minutes || 0), 0) / 60;
  const totalRevenue = entries.reduce((a, e) => a + ((e.duration_minutes || 0) / 60 * (e.hourly_rate || 0)), 0);
  const customerMap = Object.fromEntries(customers.map(c => [c.id, c.name]));

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1 p-4 md:p-8 overflow-auto">
        <AdminBreadcrumb currentPage="Uren" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Urenregistratie</h1>
            <p className="text-muted-foreground">Registreer en beheer je werkuren</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
            <Button variant="outline" onClick={() => setShowManual(true)}><Plus className="h-4 w-4 mr-2" /> Handmatig</Button>
          </div>
        </div>

        {/* Timer */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <Timer className="h-6 w-6 text-primary" />
                {activeTimer ? (
                  <span className="text-3xl font-mono font-bold text-primary">{formatDuration(elapsed)}</span>
                ) : (
                  <span className="text-muted-foreground">Start een timer om te beginnen</span>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Input placeholder="Project" value={timerProject} onChange={e => setTimerProject(e.target.value)} className="w-32" disabled={!!activeTimer} />
                <Input placeholder="Omschrijving" value={timerDesc} onChange={e => setTimerDesc(e.target.value)} className="w-40" disabled={!!activeTimer} />
                <Select value={timerCustomer} onValueChange={setTimerCustomer} disabled={!!activeTimer}>
                  <SelectTrigger className="w-32"><SelectValue placeholder="Klant" /></SelectTrigger>
                  <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="€/uur" value={timerRate} onChange={e => setTimerRate(e.target.value)} className="w-20" disabled={!!activeTimer} type="number" />
                {activeTimer ? (
                  <Button variant="destructive" onClick={stopTimer}><Square className="h-4 w-4 mr-1" /> Stop</Button>
                ) : (
                  <Button onClick={startTimer}><Play className="h-4 w-4 mr-1" /> Start</Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card><CardContent className="pt-6 flex items-center gap-3">
            <Clock className="h-8 w-8 text-primary" />
            <div><p className="text-2xl font-bold">{totalHours.toFixed(1)}u</p><p className="text-sm text-muted-foreground">Totaal uren</p></div>
          </CardContent></Card>
          <Card><CardContent className="pt-6 flex items-center gap-3">
            <Timer className="h-8 w-8 text-primary" />
            <div><p className="text-2xl font-bold">{entries.length}</p><p className="text-sm text-muted-foreground">Registraties</p></div>
          </CardContent></Card>
          <Card><CardContent className="pt-6 flex items-center gap-3">
            <Download className="h-8 w-8 text-primary" />
            <div><p className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</p><p className="text-sm text-muted-foreground">Totale waarde</p></div>
          </CardContent></Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead className="hidden md:table-cell">Klant</TableHead>
                  <TableHead>Duur</TableHead>
                  <TableHead className="hidden md:table-cell">Uurtarief</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Totaal</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">Laden...</TableCell></TableRow>
                ) : entries.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nog geen uren geregistreerd</TableCell></TableRow>
                ) : entries.map(e => (
                  <TableRow key={e.id}>
                    <TableCell>{format(new Date(e.start_time), 'd MMM', { locale: nl })}</TableCell>
                    <TableCell>{e.project || '-'}</TableCell>
                    <TableCell className="hidden md:table-cell">{e.customer_id ? customerMap[e.customer_id] || '-' : '-'}</TableCell>
                    <TableCell>{e.duration_minutes ? `${Math.floor(e.duration_minutes / 60)}u ${e.duration_minutes % 60}m` : <Badge variant="secondary">Actief</Badge>}</TableCell>
                    <TableCell className="hidden md:table-cell">{e.hourly_rate ? `€${e.hourly_rate}` : '-'}</TableCell>
                    <TableCell className="hidden md:table-cell text-right">{e.hourly_rate && e.duration_minutes ? `€${((e.duration_minutes / 60) * e.hourly_rate).toFixed(2)}` : '-'}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Manual Entry Dialog */}
        <Dialog open={showManual} onOpenChange={setShowManual}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Uren Handmatig Invoeren</DialogTitle>
              <DialogDescription>Voer je gewerkte uren in</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div><Label>Datum</Label><Input type="date" value={manualDate} onChange={e => setManualDate(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Uren</Label><Input type="number" value={manualHours} onChange={e => setManualHours(e.target.value)} placeholder="0" /></div>
                <div><Label>Minuten</Label><Input type="number" value={manualMinutes} onChange={e => setManualMinutes(e.target.value)} placeholder="0" /></div>
              </div>
              <div><Label>Project</Label><Input value={manualProject} onChange={e => setManualProject(e.target.value)} /></div>
              <div><Label>Omschrijving</Label><Input value={manualDesc} onChange={e => setManualDesc(e.target.value)} /></div>
              <div><Label>Klant</Label>
                <Select value={manualCustomer} onValueChange={setManualCustomer}>
                  <SelectTrigger><SelectValue placeholder="Selecteer klant (optioneel)" /></SelectTrigger>
                  <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Uurtarief (€)</Label><Input type="number" value={manualRate} onChange={e => setManualRate(e.target.value)} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowManual(false)}>Annuleren</Button>
              <Button onClick={handleManualSave}>Opslaan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
