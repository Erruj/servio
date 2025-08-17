import { useState, useMemo } from 'react';
import { MailItem, Category, Urgency, Sentiment } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { getCategoryColor, getUrgencyColor, getSentimentColor } from '@/lib/dummy';

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
  const filteredMails = useMemo(() => {
    let filtered = mails;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(mail => 
        mail.subject.toLowerCase().includes(query) ||
        mail.from.toLowerCase().includes(query) ||
        mail.snippet.toLowerCase().includes(query) ||
        mail.labels.some(label => label.toLowerCase().includes(query))
      );
    }

    // Apply category/status filter
    switch (filter) {
      case 'urgent':
        filtered = filtered.filter(mail => mail.labels.includes('urgent'));
        break;
      case 'unread':
        filtered = filtered.filter(mail => mail.unread);
        break;
      default:
        break;
    }

    return filtered;
  }, [mails, searchQuery, filter]);

  const handleMailClick = (mail: MailItem) => {
    onSelectMail(mail);
  };

  // Mock analysis data for display (in real app this would come from AI analysis)
  const getMailAnalysis = (mail: MailItem) => {
    // Simple heuristic for demo
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

  return (
    <div className={cn('bg-card border-r border-border overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">
          Inbox ({filteredMails.length})
        </h2>
      </div>

      {/* Mail list */}
      <div className="overflow-y-auto flex-1">
        {filteredMails.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>Geen emails gevonden</p>
            {searchQuery && (
              <p className="text-sm mt-2">Probeer een andere zoekterm</p>
            )}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredMails.map((mail) => {
              const isSelected = mail.id === selectedMailId;
              const analysis = getMailAnalysis(mail);
              const timeAgo = formatDistanceToNow(new Date(mail.receivedAt), { 
                addSuffix: true, 
                locale: nl 
              });

              return (
                <div
                  key={mail.id}
                  onClick={() => handleMailClick(mail)}
                  className={cn(
                    'p-4 rounded-xl cursor-pointer transition-all hover:bg-secondary/50',
                    isSelected && 'bg-primary/10 border border-primary/20',
                    mail.unread && 'bg-secondary/30'
                  )}
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {mail.unread && (
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      )}
                      <span className="font-medium text-sm text-foreground truncate max-w-48">
                        {mail.from.split('@')[0]}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo}
                    </span>
                  </div>

                  {/* Subject */}
                  <h3 className="font-medium text-foreground mb-2 line-clamp-1">
                    {mail.subject}
                  </h3>

                  {/* Snippet */}
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {mail.snippet}
                  </p>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1">
                    <Badge 
                      variant="secondary" 
                      className={cn('text-xs', getCategoryColor(analysis.category))}
                    >
                      {analysis.category}
                    </Badge>
                    <Badge 
                      variant="secondary"
                      className={cn('text-xs', getUrgencyColor(analysis.urgency))}
                    >
                      {analysis.urgency}
                    </Badge>
                    <Badge 
                      variant="secondary"
                      className={cn('text-xs', getSentimentColor(analysis.sentiment))}
                    >
                      {analysis.sentiment}
                    </Badge>
                    {mail.attachments && mail.attachments.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        📎 {mail.attachments.length}
                      </Badge>
                    )}
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