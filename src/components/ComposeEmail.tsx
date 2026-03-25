import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Send, X, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ComposeEmailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasConnection: boolean;
  replyTo?: { to: string; subject: string; emailId: string } | null;
}

export function ComposeEmail({ open, onOpenChange, hasConnection, replyTo }: ComposeEmailProps) {
  const { toast } = useToast();
  const [to, setTo] = useState(replyTo?.to || '');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
  const [body, setBody] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const resetForm = () => {
    setTo('');
    setCc('');
    setSubject('');
    setBody('');
    setShowCc(false);
  };

  const handleSend = async () => {
    if (!to.trim()) {
      toast({ title: 'Vul een ontvanger in', variant: 'destructive' });
      return;
    }
    if (!subject.trim()) {
      toast({ title: 'Vul een onderwerp in', variant: 'destructive' });
      return;
    }
    if (!body.trim()) {
      toast({ title: 'Voeg een bericht toe', variant: 'destructive' });
      return;
    }

    if (!hasConnection) {
      toast({
        title: 'Geen mailbox gekoppeld',
        description: 'Koppel eerst je Gmail account via Instellingen > Mailbox koppelen.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: to.trim(),
          cc: cc.trim() || undefined,
          subject: subject.trim(),
          body: body.trim(),
          replyToEmailId: replyTo?.emailId || undefined,
        },
        headers: {
          Authorization: `Bearer ${session.session?.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: '✅ E-mail verzonden', description: 'Je bericht is succesvol verzonden.' });
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Send error:', error);
      toast({
        title: 'Verzenden mislukt',
        description: error.message || 'Probeer het opnieuw.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{replyTo ? 'Antwoord' : 'Nieuwe e-mail'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="to">Aan</Label>
            <Input
              id="to"
              placeholder="ontvanger@voorbeeld.nl"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              type="email"
            />
          </div>

          <div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground px-0"
              onClick={() => setShowCc(!showCc)}
            >
              CC {showCc ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
            </Button>
            {showCc && (
              <div className="mt-1">
                <Input
                  placeholder="cc@voorbeeld.nl"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Onderwerp</Label>
            <Input
              id="subject"
              placeholder="Onderwerp"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Bericht</Label>
            <Textarea
              id="body"
              placeholder="Typ je bericht..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[200px] resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
              <X className="h-4 w-4 mr-2" />
              Annuleer
            </Button>
            <Button onClick={handleSend} disabled={isSending}>
              {isSending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Verstuur
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
