import { useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MailItem, Category, Urgency, Sentiment } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { searchQuerySchema, sanitizeText, SecurityError } from '@/lib/security';
import { buildPreview } from '@/lib/emailText';
import { useToast } from '@/hooks/use-toast';
import { Mail, MailOpen, Trash2, CheckSquare } from 'lucide-react';

interface MailListProps {
  mails: MailItem[];
  selectedMailId?: string;
  onSelectMail: (mail: MailItem) => void;
  searchQuery?: string;
  filter?: string;
  className?: string;
  // Bulk actions
  onMarkAsRead?: (ids: string[]) => void;
  onMarkAsUnread?: (ids: string[]) => void;
  onDeleteMultiple?: (ids: string[]) => void;
}

export function MailList({ 
  mails, selectedMailId, onSelectMail, searchQuery = '', filter = 'all', className,
  onMarkAsRead, onMarkAsUnread, onDeleteMultiple
}: MailListProps) {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  const filterLabels: Record<string, string> = {
    all: 'Alle mails', inbox: 'Inbox', unread: 'Ongelezen', starred: 'Met ster',
    important: 'Belangrijk', snoozed: 'Gesnoozed', spam: 'Spam', sent: 'Verzonden',
    blocked: 'Geblokkeerd',
  };

  const blockedSenders: string[] = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('servio_blocked_senders') || '[]'); } catch { return []; }
  }, [filter]);

  const safeSearchQuery = useMemo(() => {
    if (!searchQuery) return '';
    try {
      if (searchQuery.length > 0) searchQuerySchema.parse(searchQuery);
      return sanitizeText(searchQuery);
    } catch (error) {
      if (error instanceof SecurityError) {
        toast({ title: "Ongeldige zoekopdracht", description: "Gebruik alleen letters, cijfers en basis leestekens.", variant: "destructive" });
      }
      return '';
    }
  }, [searchQuery, toast]);

  const filteredMails = useMemo(() => {
    let filtered = mails;
    const hasLabel = (mail: MailItem, label: string) => mail.labels.some(l => l.toUpperCase() === label);

    if (safeSearchQuery) {
      const query = safeSearchQuery.toLowerCase();
      filtered = filtered.filter(mail => 
        mail.subject.toLowerCase().includes(query) ||
        mail.from.toLowerCase().includes(query) ||
        mail.snippet.toLowerCase().includes(query) ||
        mail.labels.some(label => label.toLowerCase().includes(query))
      );
    }

    switch (filter) {
      case 'inbox': filtered = filtered.filter(m => hasLabel(m, 'INBOX')); break;
      case 'unread': filtered = filtered.filter(m => m.unread || hasLabel(m, 'UNREAD')); break;
      case 'starred': filtered = filtered.filter(m => hasLabel(m, 'STARRED')); break;
      case 'important': filtered = filtered.filter(m => hasLabel(m, 'IMPORTANT')); break;
      case 'snoozed': filtered = filtered.filter(m => hasLabel(m, 'SNOOZED')); break;
      case 'spam': filtered = filtered.filter(m => hasLabel(m, 'SPAM')); break;
      case 'sent': filtered = filtered.filter(m => hasLabel(m, 'SENT')); break;
      case 'blocked': filtered = filtered.filter(m => blockedSenders.includes(m.from)); break;
    }

    // Hide blocked senders from non-blocked views
    if (filter !== 'blocked' && blockedSenders.length > 0) {
      filtered = filtered.filter(m => !blockedSenders.includes(m.from));
    }

    return filtered;
  }, [mails, safeSearchQuery, filter]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredMails.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMails.map(m => m.id)));
    }
  };

  const handleBulkAction = (action: 'read' | 'unread' | 'delete') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    
    if (action === 'read') onMarkAsRead?.(ids);
    else if (action === 'unread') onMarkAsUnread?.(ids);
    else if (action === 'delete') onDeleteMultiple?.(ids);
    
    setSelectedIds(new Set());
    setBulkMode(false);
  };

  const getEmailPreview = (mail: MailItem): string => {
    return buildPreview({ bodyText: mail.bodyText, bodyHtml: mail.bodyHtml || mail.body, snippet: mail.snippet }, 120);
  };

  const getMailAnalysis = (mail: MailItem) => {
    let category: Category = 'Overig';
    let urgency: Urgency = 'Normaal';
    const content = (mail.subject + ' ' + mail.body).toLowerCase();
    
    if (content.includes('retour') || content.includes('return')) category = 'Retour';
    else if (content.includes('klacht') || content.includes('beschadigd') || content.includes('boos')) category = 'Klacht';
    else if (content.includes('factuur') || content.includes('invoice')) category = 'Factuur';
    else if (content.includes('wachtwoord') || content.includes('password')) category = 'Vraag';
    else if (content.includes('error') || content.includes('technisch')) category = 'Technisch';

    if (content.includes('urgent') || content.includes('direct') || mail.labels.includes('urgent')) urgency = 'Hoog';
    else if (content.includes('snel')) urgency = 'Normaal';
    else urgency = 'Laag';

    return { category, urgency };
  };

  const getCategoryClassName = (category: Category): string => {
    const classes = { 'Retour': 'category-retour', 'Klacht': 'category-klacht', 'Factuur': 'category-factuur', 'Vraag': 'category-vraag', 'Technisch': 'category-technisch', 'Overig': 'category-overig' };
    return classes[category];
  };

  const getUrgencyClassName = (urgency: Urgency): string => {
    const classes = { 'Hoog': 'urgency-high', 'Normaal': 'urgency-normal', 'Laag': 'urgency-low' };
    return classes[urgency];
  };

  return (
    <div className={cn('bg-card border-r border-border overflow-hidden shadow-card flex flex-col', className)}>
      {/* Header */}
      <div className="p-6 border-b border-border bg-secondary/30">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground flex items-center">
            📧 {filterLabels[filter] || 'Inbox'} ({filteredMails.length})
          </h2>
          <Button variant="ghost" size="sm" onClick={() => { setBulkMode(!bulkMode); setSelectedIds(new Set()); }}>
            <CheckSquare className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Gesynchroniseerde mailboxberichten</p>
      </div>

      {/* Bulk action bar */}
      {bulkMode && selectedIds.size > 0 && (
        <div className="px-4 py-2 border-b border-border bg-primary/5 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={selectAll}>
            {selectedIds.size === filteredMails.length ? 'Deselecteer alles' : 'Selecteer alles'}
          </Button>
          <span className="text-sm text-muted-foreground">{selectedIds.size} geselecteerd</span>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={() => handleBulkAction('read')} title="Markeer als gelezen">
            <MailOpen className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleBulkAction('unread')} title="Markeer als ongelezen">
            <Mail className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleBulkAction('delete')} className="text-destructive" title="Verwijderen">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Mail list */}
      <div className="overflow-y-auto flex-1">
        {filteredMails.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground space-y-4">
            <div className="p-6 bg-secondary/30 rounded-2xl">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {safeSearchQuery ? 'Geen resultaten' : 'Geen nieuwe mails'}
              </h3>
              <p className="text-sm">
                {safeSearchQuery ? `Geen emails gevonden voor "${safeSearchQuery}"` : 'Er zijn momenteel geen emails in je inbox'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredMails.map((mail) => {
              const isSelected = mail.id === selectedMailId;
              const analysis = getMailAnalysis(mail);
              const timeAgo = formatDistanceToNow(new Date(mail.receivedAt), { addSuffix: true, locale: nl });
              const emailPreview = getEmailPreview(mail);
              const senderName = mail.from.split('@')[0].replace('.', ' ');
              const isChecked = selectedIds.has(mail.id);

              return (
                <div
                  key={mail.id}
                  onClick={() => !bulkMode && onSelectMail(mail)}
                  className={cn(
                    'p-5 cursor-pointer transition-all duration-200 border-b border-border hover:bg-secondary/50',
                    isSelected && 'bg-primary/10 border-l-4 border-l-primary shadow-card ring-1 ring-primary/20',
                    mail.unread && 'bg-secondary/30',
                    isChecked && 'bg-accent/20'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {bulkMode && (
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleSelect(mail.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      <div className="avatar-placeholder">{senderName.charAt(0).toUpperCase()}</div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground text-sm">{senderName}</span>
                        {mail.unread && <span className="text-xs text-primary font-medium">Nieuw</span>}
                      </div>
                      <div className={cn('w-3 h-3 rounded-full shadow-sm', getUrgencyClassName(analysis.urgency))} />
                    </div>
                    <span className="text-xs text-muted-foreground">{timeAgo}</span>
                  </div>

                  <h3 className="font-semibold text-foreground mb-2 line-clamp-1 text-base">{mail.subject}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{emailPreview}</p>

                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={cn('text-xs font-medium border', getCategoryClassName(analysis.category))}>
                      {analysis.category}
                    </Badge>
                    <div className="flex items-center space-x-2">
                      {mail.attachments && mail.attachments.length > 0 && (
                        <Badge variant="outline" className="text-xs">📎 {mail.attachments.length}</Badge>
                      )}
                      {mail.unread && <Badge variant="default" className="text-xs bg-primary">Nieuw</Badge>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
