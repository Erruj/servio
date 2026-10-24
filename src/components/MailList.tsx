import { useState, useMemo, useRef, useEffect } from 'react';
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
import { Mail, MailOpen, Trash2, CheckSquare, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNewItems } from '@/hooks/useNewItems';
import { BulkMailToolbar } from '@/components/inbox/BulkMailToolbar';
import { selectMailRange, currentSelection, type BulkMailAction } from '@/lib/inbox-controls';

interface MailListProps {
  serverSearch?: boolean;
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
  onToggleStar?: (mail: MailItem) => void;
  title?: string;
  onBulkAction?: (ids: string[], action: BulkMailAction, label?: string) => Promise<string[]>;
  onDisplayedMails?: (mails: MailItem[]) => void;
  focusedMailId?: string;
}

export function MailList({ 
  mails, selectedMailId, onSelectMail, searchQuery = '', filter = 'all', className, serverSearch = false,
  onMarkAsRead, onMarkAsUnread, onDeleteMultiple, onToggleStar, title, onBulkAction, onDisplayedMails, focusedMailId
}: MailListProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const anchorRef = useRef<string | null>(null);
  // Alleen nieuw binnengekomen mails krijgen een korte entrance.
  const newMailIds = useNewItems(mails.map((m) => m.id));

  const filterLabels: Record<string, string> = {
    all: 'Alle mails', inbox: 'Inbox', unread: 'Ongelezen', starred: 'Met ster',
    important: 'Belangrijk', snoozed: 'Gesnoozed', spam: 'Spam', sent: 'Verzonden',
    blocked: 'Geblokkeerd',
  };

  const blockedSenders: string[] = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('servio_blocked_senders') || '[]'); } catch { return []; }
  }, [filter]);

  const safeSearchQuery = useMemo(() => {
    if(serverSearch)return searchQuery;
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
  }, [searchQuery, toast, serverSearch]);

  const hasLabel = (mail: MailItem, label: string) => mail.labels.some(l => l.toUpperCase() === label);

  // Welke mails in de lijst horen wordt alleen herberekend bij filter-/zoekwijziging of wanneer
  // de set aan bestaande mail-ids verandert (nieuwe mail binnen, mail weg) — niet bij een
  // read/unread-toggle van een mail die al in de lijst stond.
  const mailIdsFingerprint = mails.map((m) => `${m.id}:${m.inboxReturnedAt || ''}`).join(',');
  const mailsRef = useRef(mails);
  mailsRef.current = mails;

  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const availableCategories = useMemo(() => [...new Set(mails.map(m => m.aiCategory).filter(Boolean) as string[])].sort(), [mails]);

  useEffect(() => {
    let filtered = mailsRef.current;

    if (safeSearchQuery && !serverSearch) {
      const query = safeSearchQuery.toLowerCase();
      filtered = filtered.filter(mail =>
        mail.subject.toLowerCase().includes(query) ||
        mail.from.toLowerCase().includes(query) ||
        mail.snippet.toLowerCase().includes(query) ||
        mail.labels.some(label => label.toLowerCase().includes(query))
      );
    }

    switch (filter) {
      case 'inbox':
        filtered = filtered.filter(m =>
          m.folder !== 'spam' && !hasLabel(m, 'SPAM') && !hasLabel(m, 'SENT') && !hasLabel(m, 'TRASH')
        );
        break;
      case 'unread': filtered = filtered.filter(m => m.unread || hasLabel(m, 'UNREAD')); break;
      case 'starred': filtered = filtered.filter(m => m.starred || hasLabel(m, 'STARRED')); break;
      case 'important': filtered = filtered.filter(m => hasLabel(m, 'IMPORTANT')); break;
      case 'snoozed': filtered = filtered.filter(m => hasLabel(m, 'SNOOZED')); break;
      case 'spam': filtered = filtered.filter(m => m.folder === 'spam' || hasLabel(m, 'SPAM')); break;
      case 'sent': filtered = filtered.filter(m => hasLabel(m, 'SENT')); break;
      case 'blocked': filtered = filtered.filter(m => blockedSenders.includes(m.from)); break;
    }

    if (categoryFilter !== 'all') filtered = filtered.filter(m => m.aiCategory === categoryFilter);
    if (urgencyFilter !== 'all') filtered = filtered.filter(m => m.aiUrgency === urgencyFilter);

    // Hide blocked senders from non-blocked views
    if (filter !== 'blocked' && blockedSenders.length > 0) {
      filtered = filtered.filter(m => !blockedSenders.includes(m.from));
    }

    setPinnedIds(filtered.map(m => m.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, safeSearchQuery, serverSearch, mailIdsFingerprint, blockedSenders, categoryFilter, urgencyFilter]);

  // De gepinde ids met actuele mail-data, zodat leesstatus en AI-labels live blijven meebewegen
  // binnen een bevroren lijst-samenstelling.
  const filteredMails = useMemo(() => {
    const mailById = new Map(mails.map(m => [m.id, m]));
    return pinnedIds.map(id => mailById.get(id)).filter((m): m is MailItem => Boolean(m));
  }, [pinnedIds, mails]);

  const displayedFingerprint = filteredMails.map(m => m.id).join(',');
  useEffect(() => {
    setSelectedIds(prev => new Set(currentSelection(prev, filteredMails.map(m => m.id))));
    anchorRef.current = null;
  }, [displayedFingerprint, filter, safeSearchQuery, categoryFilter, urgencyFilter]);
  useEffect(() => { onDisplayedMails?.(filteredMails); }, [filteredMails, onDisplayedMails]);
  const toggleSelect = (id: string, shift = false) => {
    if (bulkBusy) return;
    const anchor = anchorRef.current;
    setSelectedIds(prev => selectMailRange(prev, filteredMails.map(m => m.id), id, anchor, shift));
    if (!shift) anchorRef.current = id;
  };
  const selectAll = () => {
    if (bulkBusy) return;
    setSelectedIds(new Set(filteredMails.map(m => m.id)));
    setBulkMode(true);
  };
  const handleBulkAction = async (action: BulkMailAction, label?: string) => {
    const ids = currentSelection(selectedIds, filteredMails.map(m => m.id));
    if (!ids.length || !onBulkAction || bulkBusy) return;
    setBulkBusy(true);
    try { const failed = await onBulkAction(ids, action, label); setSelectedIds(new Set(failed)); setBulkMode(failed.length > 0); }
    catch { toast({title:t('mailActions.mailboxFailed'),variant:'destructive'}); }
    finally {setBulkBusy(false);}
  };

  const getEmailPreview = (mail: MailItem): string => {
    return buildPreview({ bodyText: mail.bodyText, bodyHtml: mail.bodyHtml || mail.body, snippet: mail.snippet }, 120);
  };

  const getMailAnalysis = (mail: MailItem) => ({
    category: mail.aiCategory || null,
    urgency: (['Hoog', 'Normaal', 'Laag'].includes(mail.aiUrgency || '') ? mail.aiUrgency : null) as Urgency | null,
  });

  const getCategoryClassName = (category: string): string => {
    const classes: Record<string, string> = { Klacht: 'category-klacht', Factuur: 'category-factuur', Offerte: 'category-factuur', Vraag: 'category-vraag', Klant: 'category-retour', Technisch: 'category-technisch', Retour: 'category-retour' };
    return classes[category] ?? 'category-overig';
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
            {filter !== 'all' ? (filterLabels[filter] || title) : (title || 'Inbox')} <span className="text-muted-foreground font-normal">({filteredMails.length})</span>
          </h2>
          <Button variant="ghost" size="sm" className="min-h-11" disabled={bulkBusy} title={t('inboxControls.selectAll')} aria-label={t('inboxControls.selectAll')} onClick={selectAll}>
            <CheckSquare className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2 mt-2">
          <select aria-label="Filter op categorie" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-9 flex-1 min-w-0 rounded-[10px] border border-input bg-background px-2 text-xs text-foreground">
            <option value="all">Alle categorieën</option>
            {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select aria-label="Filter op urgentie" value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)} className="h-9 flex-1 min-w-0 rounded-[10px] border border-input bg-background px-2 text-xs text-foreground">
            <option value="all">Alle urgenties</option>
            <option value="Hoog">Hoog</option>
            <option value="Normaal">Normaal</option>
            <option value="Laag">Laag</option>
          </select>
        </div>
      </div>

      {selectedIds.size > 0 && <BulkMailToolbar count={selectedIds.size} busy={bulkBusy} onClear={()=>{setSelectedIds(new Set());setBulkMode(false);}} onAction={(action,label)=>void handleBulkAction(action,label)} />}

      {/* Mail list (virtualized) */}
      <VirtualMailList
        mails={filteredMails}
        bulkMode={bulkMode || selectedIds.size > 0}
        selectedIds={selectedIds}
        selectedMailId={selectedMailId}
        focusedMailId={focusedMailId}
        selectionDisabled={bulkBusy}
        onSelectMail={onSelectMail}
        newMailIds={newMailIds}
        toggleSelect={toggleSelect}
        onToggleStar={onToggleStar}
        getEmailPreview={getEmailPreview}
        getMailAnalysis={getMailAnalysis}
        getCategoryClassName={getCategoryClassName}
        getUrgencyClassName={getUrgencyClassName}
        emptyMessage={safeSearchQuery ? `Geen emails gevonden voor "${safeSearchQuery}"` : t('mailActions.emptyFolderDesc')}
        emptyTitle={safeSearchQuery ? 'Geen resultaten' : t('mailActions.emptyFolderTitle')}
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
  newMailIds: Set<string>;
  toggleSelect: (id: string, shift?: boolean) => void;
  focusedMailId?: string;
  selectionDisabled?: boolean;
  onToggleStar?: (mail: MailItem) => void;
  getEmailPreview: (mail: MailItem) => string;
  getMailAnalysis: (mail: MailItem) => { category: string | null; urgency: Urgency | null };
  getCategoryClassName: (c: string) => string;
  getUrgencyClassName: (u: Urgency) => string;
  emptyTitle: string;
  emptyMessage: string;
}

function VirtualMailList(props: VirtualMailListProps) {
  const { mails, bulkMode, selectedIds, selectedMailId, focusedMailId, selectionDisabled, onSelectMail, newMailIds, toggleSelect, onToggleStar, getEmailPreview, getMailAnalysis, getCategoryClassName, getUrgencyClassName, emptyTitle, emptyMessage } = props;
  const { t } = useTranslation();
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: mails.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 104,
    overscan: 10,
  });

  useEffect(() => {
    const index = mails.findIndex(mail => mail.id === focusedMailId);
    if (index >= 0) rowVirtualizer.scrollToIndex(index, {align:'auto'});
  }, [focusedMailId, mails, rowVirtualizer]);

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
              onClick={(event) => {if(bulkMode || event.shiftKey) toggleSelect(mail.id,event.shiftKey); else onSelectMail(mail);}}
              data-mail-id={mail.id}
              className={cn(
                'group relative px-4 py-3 cursor-pointer transition-colors duration-150 border-b border-border/40',
                !isSelected && 'hover:bg-secondary/60',
                newMailIds.has(mail.id) && 'animate-item-fade',
                isSelected && 'bg-primary/10',
                focusedMailId === mail.id && 'ring-1 ring-inset ring-primary',
                isChecked && 'bg-accent/15'
              )}
            >
              {/* Selected accent bar */}
              {isSelected && (
                <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary rounded-r-sm" />
              )}

              <div className="flex items-start gap-2.5 pl-1">
                <div className={cn('shrink-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100', bulkMode ? 'opacity-100' : 'opacity-100 sm:opacity-0')}>
                  <Checkbox aria-label={`${t('inboxControls.select')}: ${mail.subject}`} disabled={selectionDisabled} checked={isChecked} onClick={e=>{e.stopPropagation();toggleSelect(mail.id,e.shiftKey);}} className="mt-1 h-5 w-5" />
                </div>

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
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-[11px] text-muted-foreground">{timeAgo}</span>
                      {onToggleStar && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onToggleStar(mail); }}
                          aria-label={mail.starred ? t('mailActions.unstar') : t('mailActions.star')}
                          title={mail.starred ? t('mailActions.unstar') : t('mailActions.star')}
                          className="-m-2 p-2 rounded-[10px] text-muted-foreground hover:text-foreground"
                        >
                          <Star className={cn('h-4 w-4', mail.starred && 'fill-warning text-warning')} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className={cn(
                    'text-[13px] truncate mb-0.5',
                    mail.unread ? 'font-semibold text-foreground' : 'text-foreground/80'
                  )}>
                    {mail.subject}
                  </div>
                  <div className="text-[12px] text-muted-foreground truncate">
                    {mail.followUpPending ? t('mailReminders.unanswered') : emailPreview}
                  </div>
                  {mail.labels.includes('SNOOZED') && <Badge variant="secondary" className="mt-1 text-xs">{t('mailReminders.label')}</Badge>}
                  {(() => { const a = getMailAnalysis(mail); if (!a.category && !a.urgency) return null; return (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {a.urgency && <span title={`Urgentie: ${a.urgency}`} aria-label={`Urgentie: ${a.urgency}`} className={cn('block w-2 h-2 rounded-full', getUrgencyClassName(a.urgency))} />}
                      {a.category && <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-5 rounded-full', getCategoryClassName(a.category))}>{a.category}</Badge>}
                    </div>
                  ); })()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
