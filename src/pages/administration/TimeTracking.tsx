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
import { Play, Square, Plus, Clock, Timer, Download, Trash2, Pencil, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { AdminBreadcrumb } from '@/components/AdminBreadcrumb';
import { CreateInvoiceFromHoursDialog } from '@/components/CreateInvoiceFromHoursDialog';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
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
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Edit state
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);
  const [editProject, setEditProject] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCustomer, setEditCustomer] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');

  // Timer form
  const [timerProject, setTimerProject] = useState('');
  const [timerDesc, setTimerDesc] = useState('');
  const [timerCustomer, setTimerCustomer] = useState('');
  const [timerRate, setTimerRate] = useState('');

  // Manual form
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualStartTime, setManualStartTime] = useState('09:00');
  const [manualEndTime, setManualEndTime] = useState('17:00');
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
    const now = new Date();
    const { data, error } = await supabase.from('time_entries').insert({
      user_id: user.user.id, customer_id: timerCustomer || null, project: timerProject || null,
      description: timerDesc || null, start_time: now.toISOString(),
      hourly_rate: timerRate ? Number(timerRate) : null, billable: true,
    }).select('id').single();
    if (error || !data) { toast.error('Fout bij starten timer'); return; }
    setActiveTimer(data.id);
    setTimerStartTime(now);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    toast.success('Timer gestart');
  };

  const stopTimer = async () => {
    if (!activeTimer) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const endTime = new Date();
    const durationMinutes = Math.round(elapsed / 60);
    await supabase.from('time_entries').update({
      end_time: endTime.toISOString(), duration_minutes: Math.max(1, durationMinutes),
    }).eq('id', activeTimer);
    toast.success(`Timer gestopt — ${timerStartTime ? format(timerStartTime, 'HH:mm') : ''} – ${format(endTime, 'HH:mm')} (${Math.max(1, durationMinutes)} min)`);
    setActiveTimer(null);
    setElapsed(0);
    setTimerStartTime(null);
    setTimerProject(''); setTimerDesc(''); setTimerCustomer(''); setTimerRate('');
    loadData();
  };

  const handleManualSave = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    let totalMinutes: number;
    let startTime: Date;
    let endTime: Date;

    if (manualStartTime && manualEndTime) {
      startTime = new Date(`${manualDate}T${manualStartTime}:00`);
      endTime = new Date(`${manualDate}T${manualEndTime}:00`);
      totalMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
    } else {
      totalMinutes = (Number(manualHours) || 0) * 60 + (Number(manualMinutes) || 0);
      startTime = new Date(`${manualDate}T09:00:00`);
      endTime = new Date(startTime.getTime() + totalMinutes * 60000);
    }

    if (totalMinutes <= 0) { toast.error('Voer geldige tijden in'); return; }

    const { error } = await supabase.from('time_entries').insert({
      user_id: user.user.id, customer_id: manualCustomer || null, project: manualProject || null,
      description: manualDesc || null, start_time: startTime.toISOString(), end_time: endTime.toISOString(),
      duration_minutes: totalMinutes, hourly_rate: manualRate ? Number(manualRate) : null, billable: true,
    });
    if (error) { toast.error('Fout bij opslaan'); return; }
    toast.success('Uren geregistreerd');
    setShowManual(false);
    setManualHours(''); setManualMinutes(''); setManualProject(''); setManualDesc(''); setManualCustomer(''); setManualRate('');
    setManualStartTime('09:00'); setManualEndTime('17:00');
    loadData();
  };

  const openEdit = (e: TimeEntry) => {
    setEditEntry(e);
    setEditProject(e.project || '');
    setEditDesc(e.description || '');
    setEditCustomer(e.customer_id || '');
    setEditRate(e.hourly_rate?.toString() || '');
    const st = new Date(e.start_time);
    setEditStartDate(format(st, 'yyyy-MM-dd'));
    setEditStartTime(format(st, 'HH:mm'));
    setEditEndTime(e.end_time ? format(new Date(e.end_time), 'HH:mm') : '');
  };

  const handleEditSave = async () => {
    if (!editEntry) return;
    const startDt = new Date(`${editStartDate}T${editStartTime}:00`);
    const endDt = editEndTime ? new Date(`${editStartDate}T${editEndTime}:00`) : null;
    const durationMinutes = endDt ? Math.round((endDt.getTime() - startDt.getTime()) / 60000) : editEntry.duration_minutes;

    const { error } = await supabase.from('time_entries').update({
      project: editProject || null, description: editDesc || null,
      customer_id: editCustomer || null, hourly_rate: editRate ? Number(editRate) : null,
      start_time: startDt.toISOString(), end_time: endDt?.toISOString() || null,
      duration_minutes: durationMinutes && durationMinutes > 0 ? durationMinutes : null,
    }).eq('id', editEntry.id);

    if (error) { toast.error('Fout bij opslaan'); return; }
    toast.success('Registratie bijgewerkt');
    setEditEntry(null);
    loadData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from('time_entries').delete().eq('id', deleteId);
      if (error) throw error;
      toast.success('Registratie verwijderd');
      setDeleteId(null);
      loadData();
    } catch (e) {
      console.error(e);
      toast.error('Fout bij verwijderen registratie');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Datum', 'Start', 'Eind', 'Project', 'Omschrijving', 'Uren', 'Uurtarief', 'Totaal'];
    const rows = entries.map(e => [
      format(new Date(e.start_time), 'dd-MM-yyyy'),
      format(new Date(e.start_time), 'HH:mm'),
      e.end_time ? format(new Date(e.end_time), 'HH:mm') : '',
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

  const formatTimeRange = (e: TimeEntry) => {
    const start = format(new Date(e.start_time), 'HH:mm');
    const end = e.end_time ? format(new Date(e.end_time), 'HH:mm') : '…';
    const hours = e.duration_minutes ? `${Math.floor(e.duration_minutes / 60)}u ${e.duration_minutes % 60}m` : '';
    return `${start} – ${end}${hours ? ` (${hours})` : ''}`;
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
            <Button variant="default" onClick={() => setShowCreateInvoice(true)}><FileText className="h-4 w-4 mr-2" /> Factuur van uren</Button>
            <Button variant="outline" onClick={handleExportCSV}><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
            <Button variant="outline" onClick={() => setShowManual(true)}><Plus className="h-4 w-4 mr-2" /> Handmatig</Button>
          </div>
        </div>

        <CreateInvoiceFromHoursDialog
          open={showCreateInvoice}
          onOpenChange={setShowCreateInvoice}
          entries={entries}
          customers={customers}
          onDone={loadData}
        />

        {/* Timer */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <Timer className="h-6 w-6 text-primary" />
                {activeTimer ? (
                  <div className="flex flex-col">
                    <span className="text-3xl font-mono font-bold text-primary">{formatDuration(elapsed)}</span>
                    {timerStartTime && (
                      <span className="text-xs text-muted-foreground">Gestart om {format(timerStartTime, 'HH:mm')}</span>
                    )}
                  </div>
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
                  <TableHead>Tijd</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead className="hidden md:table-cell">Klant</TableHead>
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
                    <TableCell className="text-sm">
                      {e.duration_minutes ? (
                        <span>{formatTimeRange(e)}</span>
                      ) : (
                        <Badge variant="secondary">Actief</Badge>
                      )}
                    </TableCell>
                    <TableCell>{e.project || '-'}</TableCell>
                    <TableCell className="hidden md:table-cell">{e.customer_id ? customerMap[e.customer_id] || '-' : '-'}</TableCell>
                    <TableCell className="hidden md:table-cell">{e.hourly_rate ? `€${e.hourly_rate}` : '-'}</TableCell>
                    <TableCell className="hidden md:table-cell text-right">{e.hourly_rate && e.duration_minutes ? `€${((e.duration_minutes / 60) * e.hourly_rate).toFixed(2)}` : '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(e)}><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
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
                <div><Label>Starttijd</Label><Input type="time" value={manualStartTime} onChange={e => setManualStartTime(e.target.value)} /></div>
                <div><Label>Eindtijd</Label><Input type="time" value={manualEndTime} onChange={e => setManualEndTime(e.target.value)} /></div>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">Of voer handmatig uren/minuten in:</p>
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

        {/* Edit Entry Dialog */}
        <Dialog open={!!editEntry} onOpenChange={(open) => !open && setEditEntry(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registratie Bewerken</DialogTitle>
              <DialogDescription>Pas de gegevens van deze tijdregistratie aan</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div><Label>Datum</Label><Input type="date" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Starttijd</Label><Input type="time" value={editStartTime} onChange={e => setEditStartTime(e.target.value)} /></div>
                <div><Label>Eindtijd</Label><Input type="time" value={editEndTime} onChange={e => setEditEndTime(e.target.value)} /></div>
              </div>
              <div><Label>Project</Label><Input value={editProject} onChange={e => setEditProject(e.target.value)} /></div>
              <div><Label>Omschrijving</Label><Input value={editDesc} onChange={e => setEditDesc(e.target.value)} /></div>
              <div><Label>Klant</Label>
                <Select value={editCustomer} onValueChange={setEditCustomer}>
                  <SelectTrigger><SelectValue placeholder="Selecteer klant" /></SelectTrigger>
                  <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Uurtarief (€)</Label><Input type="number" value={editRate} onChange={e => setEditRate(e.target.value)} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditEntry(null)}>Annuleren</Button>
              <Button onClick={handleEditSave}>Opslaan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}