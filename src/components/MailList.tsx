import { useState, useMemo } from 'react';
import { MailItem, Category, Urgency, Sentiment } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

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

  // Get first 10 words from email body
  const getEmailPreview = (body: string): string => {
    const words = body.split(' ').slice(0, 10);
    return words.join(' ') + (body.split(' ').length > 10 ? '...' : '');
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
          📧 Inbox ({filteredMails.length})
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Inkomende support emails
        </p>
      </div>

      {/* Mail list */}
      <div className="overflow-y-auto flex-1">
        {filteredMails.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-lg mb-2">Geen emails gevonden</p>
            {searchQuery && (
              <p className="text-sm">Probeer een andere zoekterm</p>
            )}
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