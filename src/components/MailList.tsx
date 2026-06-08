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
    <div className={cn('bg-card overflow-hidden flex flex-col', className)}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/60">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-foreground">
            {filterLabels[filter] || 'Inbox'} <span className="text-muted-foreground font-normal">({filteredMails.length})</span>
          </h2>
          <Button variant="ghost" size="sm" onClick={() => { setBulkMode(!bulkMode); setSelectedIds(new Set()); }}>
            <CheckSquare className="h-4 w-4" />
          </Button>
        </div>
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

      {/* Mail list (virtualized) */}
      <VirtualMailList
        mails={filteredMails}
        bulkMode={bulkMode}
        selectedIds={selectedIds}
        selectedMailId={selectedMailId}
        onSelectMail={onSelectMail}
        toggleSelect={toggleSelect}
        getEmailPreview={getEmailPreview}
        getMailAnalysis={getMailAnalysis}
        getCategoryClassName={getCategoryClassName}
        getUrgencyClassName={getUrgencyClassName}
        emptyMessage={safeSearchQuery ? `Geen emails gevonden voor "${safeSearchQuery}"` : 'Er zijn momenteel geen emails in je inbox'}
        emptyTitle={safeSearchQuery ? 'Geen resultaten' : 'Geen nieuwe mails'}
      />
    </div>
  );
}

interface VirtualMailListProps {
  mails: MailItem[];
  bulkMode: boolean;
  selectedIds: Set<string>;
  selectedMailId?: string;
  onSelectMail: (mail: MailItem) => void;
  toggleSelect: (id: string) => void;
  getEmailPreview: (mail: MailItem) => string;
  getMailAnalysis: (mail: MailItem) => { category: Category; urgency: Urgency };
  getCategoryClassName: (c: Category) => string;
  getUrgencyClassName: (u: Urgency) => string;
  emptyTitle: string;
  emptyMessage: string;
}

function VirtualMailList(props: VirtualMailListProps) {
  const { mails, bulkMode, selectedIds, selectedMailId, onSelectMail, toggleSelect, getEmailPreview, getMailAnalysis, getCategoryClassName, getUrgencyClassName, emptyTitle, emptyMessage } = props;
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: mails.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 84,
    overscan: 10,
  });

  if (mails.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground space-y-4 flex-1 overflow-y-auto">
        <div className="p-6 bg-secondary/30 rounded-2xl">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{emptyTitle}</h3>
          <p className="text-sm">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="overflow-y-auto flex-1">
      <div style={{ height: rowVirtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const mail = mails[virtualRow.index];
          const isSelected = mail.id === selectedMailId;
          const timeAgo = formatDistanceToNow(new Date(mail.receivedAt), { addSuffix: false, locale: nl });
          const emailPreview = getEmailPreview(mail);
          const senderName = mail.from.split('@')[0].replace('.', ' ');
          const isChecked = selectedIds.has(mail.id);

          return (
            <div
              key={mail.id}
              ref={rowVirtualizer.measureElement}
              data-index={virtualRow.index}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${virtualRow.start}px)` }}
              onClick={() => !bulkMode && onSelectMail(mail)}
              className={cn(
                'relative px-4 py-3 cursor-pointer transition-colors duration-150 border-b border-border/40',
                !isSelected && 'hover:bg-secondary/60',
                isSelected && 'bg-[hsl(214,100%,96%)] dark:bg-primary/15',
                isChecked && 'bg-accent/15'
              )}
            >
              {/* Selected accent bar */}
              {isSelected && (
                <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary rounded-r-sm" />
              )}

              <div className="flex items-start gap-2.5 pl-1">
                {bulkMode && (
                  <Checkbox checked={isChecked} onCheckedChange={() => toggleSelect(mail.id)} onClick={(e) => e.stopPropagation()} className="mt-1" />
                )}

                {/* Unread dot */}
                <div className="flex-shrink-0 pt-1.5 w-2.5">
                  {mail.unread && <span className="block w-2 h-2 rounded-full bg-primary" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className={cn(
                      'text-[13px] truncate',
                      mail.unread ? 'font-semibold text-foreground' : 'font-medium text-foreground/90'
                    )}>
                      {senderName}
                    </span>
                    <span className="text-[11px] text-muted-foreground flex-shrink-0">{timeAgo}</span>
                  </div>
                  <div className={cn(
                    'text-[13px] truncate mb-0.5',
                    mail.unread ? 'text-foreground' : 'text-foreground/80'
                  )}>
                    {mail.subject}
                  </div>
                  <div className="text-[12px] text-muted-foreground truncate">
                    {emailPreview}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
