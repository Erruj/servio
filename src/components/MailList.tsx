import { useState, useMemo } from 'react';
import { MailItem, Category, Urgency, Sentiment } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { searchQuerySchema, sanitizeText, SecurityError } from '@/lib/security';
import { useToast } from '@/hooks/use-toast';

interface MailListProps {
  mails: MailItem[];
  selectedMailId?: string;
  onSelectMail: (mail: MailItem) => void;
  searchQuery?: string;
  filter?: string;
  className?: string;
}

export function MailList({ 
  mails, 
  selectedMailId, 
  onSelectMail, 
  searchQuery = '', 
  filter = 'all',
  className 
}: MailListProps) {
  const { toast } = useToast();

  // Validate and sanitize search query
  const safeSearchQuery = useMemo(() => {
    if (!searchQuery) return '';
    
    try {
      if (searchQuery.length > 0) {
        searchQuerySchema.parse(searchQuery);
      }
      return sanitizeText(searchQuery);
    } catch (error) {
      if (error instanceof SecurityError) {
        toast({
          title: "Ongeldige zoekopdracht",
          description: "Gebruik alleen letters, cijfers en basis leestekens.",
          variant: "destructive"
        });
      }
      return '';
    }
  }, [searchQuery, toast]);
  const filteredMails = useMemo(() => {
    let filtered = mails;
    const hasLabel = (mail: MailItem, label: string) => mail.labels.some((mailLabel) => mailLabel.toUpperCase() === label);

    // Apply search filter
    if (safeSearchQuery) {
      const query = safeSearchQuery.toLowerCase();
      filtered = filtered.filter(mail => 
        mail.subject.toLowerCase().includes(query) ||
        mail.from.toLowerCase().includes(query) ||
        mail.snippet.toLowerCase().includes(query) ||
        mail.labels.some(label => label.toLowerCase().includes(query))
      );
    }

    // Apply category/status filter
    switch (filter) {
      case 'inbox':
        filtered = filtered.filter((mail) => hasLabel(mail, 'INBOX'));
        break;
      case 'unread':
        filtered = filtered.filter((mail) => mail.unread || hasLabel(mail, 'UNREAD'));
        break;
      case 'starred':
        filtered = filtered.filter((mail) => hasLabel(mail, 'STARRED'));
        break;
      case 'important':
        filtered = filtered.filter((mail) => hasLabel(mail, 'IMPORTANT'));
        break;
      case 'snoozed':
        filtered = filtered.filter((mail) => hasLabel(mail, 'SNOOZED'));
        break;
      case 'spam':
        filtered = filtered.filter((mail) => hasLabel(mail, 'SPAM'));
        break;
      case 'sent':
        filtered = filtered.filter((mail) => hasLabel(mail, 'SENT'));
        break;
      default:
        break;
    }

    return filtered;
  }, [mails, safeSearchQuery, filter]);

  const handleMailClick = (mail: MailItem) => {
    onSelectMail(mail);
  };

  // Get first 10 words from email body, stripping HTML tags
  const getEmailPreview = (body: string): string => {
    // Strip HTML tags and decode entities
    const textOnly = body
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
    const words = textOnly.split(' ').filter(w => w.length > 0).slice(0, 12);
    return words.join(' ') + (textOnly.split(' ').length > 12 ? '...' : '');
  };

  // Heuristic analysis data for display
  const getMailAnalysis = (mail: MailItem) => {
    // Simple heuristic categorization based on content
    let category: Category = 'Overig';
    let urgency: Urgency = 'Normaal';
    let sentiment: Sentiment = 'Neutraal';

    const content = (mail.subject + ' ' + mail.body).toLowerCase();
    
    if (content.includes('retour') || content.includes('return')) category = 'Retour';
    else if (content.includes('klacht') || content.includes('beschadigd') || content.includes('boos')) category = 'Klacht';
    else if (content.includes('factuur') || content.includes('invoice')) category = 'Factuur';
    else if (content.includes('wachtwoord') || content.includes('password')) category = 'Vraag';
    else if (content.includes('error') || content.includes('technisch')) category = 'Technisch';

    if (content.includes('urgent') || content.includes('direct') || mail.labels.includes('urgent')) urgency = 'Hoog';
    else if (content.includes('snel')) urgency = 'Normaal';
    else urgency = 'Laag';

    if (content.includes('bedankt') || content.includes('geweldig')) sentiment = 'Positief';
    else if (content.includes('boos') || content.includes('teleurstellend') || content.includes('onacceptabel')) sentiment = 'Negatief';

    return { category, urgency, sentiment };
  };

  const getCategoryClassName = (category: Category): string => {
    const classes = {
      'Retour': 'category-retour',
      'Klacht': 'category-klacht', 
      'Factuur': 'category-factuur',
      'Vraag': 'category-vraag',
      'Technisch': 'category-technisch',
      'Overig': 'category-overig'
    };
    return classes[category];
  };

  const getUrgencyClassName = (urgency: Urgency): string => {
    const classes = {
      'Hoog': 'urgency-high',
      'Normaal': 'urgency-normal', 
      'Laag': 'urgency-low'
    };
    return classes[urgency];
  };

  return (
    <div className={cn('bg-card border-r border-border overflow-hidden shadow-card', className)}>
      {/* Header */}
      <div className="p-6 border-b border-border bg-secondary/30">
        <h2 className="text-xl font-bold text-foreground flex items-center">
          📧 {filter === 'all' ? 'Alle mails' : 'Inbox'} ({filteredMails.length})
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gesynchroniseerde mailboxberichten
        </p>
      </div>

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
                {safeSearchQuery 
                  ? `Geen emails gevonden voor "${safeSearchQuery}"`
                  : 'Er zijn momenteel geen emails in je inbox'
                }
              </p>
              {safeSearchQuery && (
                <p className="text-xs mt-2 text-muted-foreground">
                  Probeer een andere zoekterm of verwijder de filters
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredMails.map((mail) => {
              const isSelected = mail.id === selectedMailId;
              const analysis = getMailAnalysis(mail);
              const timeAgo = formatDistanceToNow(new Date(mail.receivedAt), { 
                addSuffix: true, 
                locale: nl 
              });
              const emailPreview = getEmailPreview(mail.body);
              const senderName = mail.from.split('@')[0].replace('.', ' ');

              return (
                <div
                  key={mail.id}
                  onClick={() => handleMailClick(mail)}
                  className={cn(
                    'p-5 cursor-pointer transition-all duration-200 border-b border-border hover:bg-secondary/50',
                    isSelected && 'bg-primary/10 border-l-4 border-l-primary shadow-card ring-1 ring-primary/20',
                    mail.unread && 'bg-secondary/30'
                  )}
                >
                   {/* Header row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {/* Avatar */}
                      <div className="avatar-placeholder">
                        {senderName.charAt(0).toUpperCase()}
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground text-sm">
                          {senderName}
                        </span>
                        {mail.unread && (
                          <span className="text-xs text-primary font-medium">Nieuw</span>
                        )}
                      </div>
                      
                      {/* Urgency indicator */}
                      <div className={cn(
                        'w-3 h-3 rounded-full shadow-sm',
                        getUrgencyClassName(analysis.urgency)
                      )} />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo}
                    </span>
                  </div>

                  {/* Subject */}
                  <h3 className="font-semibold text-foreground mb-2 line-clamp-1 text-base">
                    {mail.subject}
                  </h3>

                  {/* Email preview - first 10 words */}
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {emailPreview}
                  </p>

                  {/* Category badge and attachments */}
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="outline" 
                      className={cn('text-xs font-medium border', getCategoryClassName(analysis.category))}
                    >
                      {analysis.category}
                    </Badge>
                    
                    <div className="flex items-center space-x-2">
                      {mail.attachments && mail.attachments.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          📎 {mail.attachments.length}
                        </Badge>
                      )}
                      {mail.unread && (
                        <Badge variant="default" className="text-xs bg-primary">
                          Nieuw
                        </Badge>
                      )}
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