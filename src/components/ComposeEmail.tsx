import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Send, X, ChevronDown, ChevronUp, Paperclip, FileIcon, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AttachmentFile {
  file: File;
  base64: string;
}

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
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTo('');
    setCc('');
    setSubject('');
    setBody('');
    setShowCc(false);
    setAttachments([]);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxSize = 10 * 1024 * 1024; // 10MB per file
    const newAttachments: AttachmentFile[] = [];

    for (const file of Array.from(files)) {
      if (file.size > maxSize) {
        toast({
          title: 'Bestand te groot',
          description: `${file.name} is groter dan 10MB.`,
          variant: 'destructive',
        });
        continue;
      }

      const base64 = await fileToBase64(file);
      newAttachments.push({ file, base64 });
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

      const emailAttachments = attachments.map(att => ({
        filename: att.file.name,
        mimeType: att.file.type || 'application/octet-stream',
        content: att.base64,
      }));

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: to.trim(),
          cc: cc.trim() || undefined,
          subject: subject.trim(),
          body: body.trim(),
          replyToEmailId: replyTo?.emailId || undefined,
          attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
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

          {/* Attachments */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4 mr-2" />
              Bijlage toevoegen
            </Button>

            {attachments.length > 0 && (
              <div className="space-y-1">
                {attachments.map((att, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-muted rounded-md px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{att.file.name}</span>
                      <span className="text-muted-foreground text-xs flex-shrink-0">
                        ({formatFileSize(att.file.size)})
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeAttachment(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
