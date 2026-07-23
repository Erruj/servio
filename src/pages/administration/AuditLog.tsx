import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminBreadcrumb } from '@/components/AdminBreadcrumb';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Shield, Filter } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface AuditEntry {
  id: string;
  user_id: string | null;
  action: string;
  endpoint: string | null;
  status: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export default function AuditLog() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      setLogs((data as AuditEntry[]) || []);
    } catch (e) { console.error('Error loading audit logs:', e); }
    finally { setLoading(false); }
  };

  const filtered = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.endpoint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_id?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Success</Badge>;
      case 'error': return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Error</Badge>;
      case 'warning': return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Warning</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <AdminBreadcrumb currentPage="Audit Log" />
      <PageHeader
        title="Audit Log"
        description="Overzicht van alle systeem- en gebruikersacties"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div><CardTitle>Activiteiten</CardTitle><CardDescription>{filtered.length} log entries</CardDescription></div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Zoek in logs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 w-64" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="Geen log entries gevonden"
              description="Systeem- en gebruikersacties verschijnen hier zodra ze plaatsvinden."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tijd</TableHead>
                    <TableHead>Actie</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap" title={log.created_at ? format(new Date(log.created_at), "PPP HH:mm:ss", { locale: nl }) : ''}>
                        {log.created_at ? formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: nl }) : '-'}
                      </TableCell>
                      <TableCell className="font-medium">{log.action}</TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">{log.endpoint || '-'}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{log.ip_address || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
