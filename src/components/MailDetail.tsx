import { MailItem } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Paperclip, Reply, Forward, Archive, Tag } from 'lucide-react';

interface MailDetailProps {
  mail: MailItem | null;
  className?: string;
}

export function MailDetail({ mail, className }: MailDetailProps) {
  if (!mail) {
    return (
      <div className={`bg-card flex items-center justify-center ${className}`}>
        <div className="text-center text-muted-foreground">
          <p className="text-lg mb-2">Selecteer een email</p>
          <p className="text-sm">Kies een email uit de inbox om de details te bekijken</p>
        </div>
      </div>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(mail.receivedAt), { 
    addSuffix: true, 
    locale: nl 
  });

  const fullDate = format(new Date(mail.receivedAt), "PPP 'om' HH:mm", { locale: nl });

  return (
    <div className={`bg-card overflow-y-auto ${className}`}>
      <Card className="m-4 shadow-sm">
        <CardHeader className="pb-4">
          {/* Quick actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Reply className="h-4 w-4 mr-2" />
                Antwoord
              </Button>
              <Button variant="outline" size="sm">
                <Forward className="h-4 w-4 mr-2" />
                Stuur door
              </Button>
              <Button variant="outline" size="sm">
                <Archive className="h-4 w-4 mr-2" />
                Archiveer
              </Button>
              <Button variant="outline" size="sm">
                <Tag className="h-4 w-4 mr-2" />
                Label
              </Button>
            </div>
            {mail.unread && (
              <Badge variant="default" className="bg-primary">
                Nieuw
              </Badge>
            )}
          </div>

          {/* Subject */}
          <h1 className="text-xl font-semibold text-foreground mb-4">
            {mail.subject}
          </h1>

          {/* Email metadata */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-muted-foreground">Van: </span>
                <span className="font-medium text-foreground">{mail.from}</span>
              </div>
              <span className="text-muted-foreground" title={fullDate}>
                {timeAgo}
              </span>
            </div>
            
            <div>
              <span className="text-muted-foreground">Aan: </span>
              <span className="font-medium text-foreground">{mail.to.join(', ')}</span>
            </div>

            {mail.labels.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">Labels: </span>
                <div className="flex flex-wrap gap-1">
                  {mail.labels.map((label) => (
                    <Badge key={label} variant="secondary" className="text-xs">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {mail.attachments && mail.attachments.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">Bijlagen: </span>
                <div className="flex flex-wrap gap-2">
                  {mail.attachments.map((attachment, index) => (
                    <div 
                      key={index}
                      className="flex items-center space-x-1 bg-secondary rounded-lg px-2 py-1"
                    >
                      <Paperclip className="h-3 w-3" />
                      <span className="text-xs font-medium">{attachment.name}</span>
                      {attachment.sizeKB && (
                        <span className="text-xs text-muted-foreground">
                          ({attachment.sizeKB}KB)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Email body */}
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-foreground leading-relaxed">
              {mail.body}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}