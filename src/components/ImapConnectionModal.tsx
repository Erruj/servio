import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface ImapConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: () => void;
}

const PRESETS = [
  { name: 'Namecheap Private Email', imap: 'mail.privateemail.com', smtp: 'mail.privateemail.com', imapPort: 993, smtpPort: 587 },
  { name: 'Gmail', imap: 'imap.gmail.com', smtp: 'smtp.gmail.com', imapPort: 993, smtpPort: 587 },
  { name: 'Outlook / Office 365', imap: 'outlook.office365.com', smtp: 'smtp.office365.com', imapPort: 993, smtpPort: 587 },
  { name: 'Zoho Mail', imap: 'imap.zoho.eu', smtp: 'smtp.zoho.eu', imapPort: 993, smtpPort: 587 },
  { name: 'Yahoo Mail', imap: 'imap.mail.yahoo.com', smtp: 'smtp.mail.yahoo.com', imapPort: 993, smtpPort: 587 },
];

export function ImapConnectionModal({ open, onOpenChange, onConnected }: ImapConnectionModalProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState('993');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [useSsl, setUseSsl] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testError, setTestError] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setImapHost('');
    setImapPort('993');
    setSmtpHost('');
    setSmtpPort('587');
    setUseSsl(true);
    setTestResult(null);
    setTestError('');
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setImapHost(preset.imap);
    setSmtpHost(preset.smtp);
    setImapPort(String(preset.imapPort));
    setSmtpPort(String(preset.smtpPort));
    setTestResult(null);
  };

  const callImapConnect = async (action: 'test' | 'connect') => {
    if (!email || !password || !imapHost || !smtpHost) {
      toast({ title: 'Vul alle verplichte velden in', variant: 'destructive' });
      return false;
    }

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      toast({ title: 'Niet ingelogd', variant: 'destructive' });
      return false;
    }

    const { data, error } = await supabase.functions.invoke('imap-connect', {
      body: {
        action,
        email: email.trim(),
        password,
        imap_host: imapHost.trim(),
        imap_port: parseInt(imapPort) || 993,
        smtp_host: smtpHost.trim(),
        smtp_port: parseInt(smtpPort) || 587,
        use_ssl: useSsl,
      },
      headers: { Authorization: `Bearer ${session.session.access_token}` },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return true;
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    setTestError('');

    try {
      await callImapConnect('test');
      setTestResult('success');
      toast({ title: '✅ Verbinding succesvol', description: 'IMAP en SMTP werken correct.' });
    } catch (err: any) {
      setTestResult('error');
      setTestError(err.message || 'Verbinding mislukt');
      toast({ title: 'Verbinding mislukt', description: err.message, variant: 'destructive' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await callImapConnect('connect');
      toast({ title: '✅ E-mail gekoppeld!', description: `${email} is succesvol gekoppeld.` });
      resetForm();
      onOpenChange(false);
      onConnected();
    } catch (err: any) {
      toast({ title: 'Koppelen mislukt', description: err.message, variant: 'destructive' });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🔗 E-mail koppelen via IMAP</DialogTitle>
          <DialogDescription>
            Koppel elk e-mailadres via IMAP/SMTP. Werkt met alle providers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Quick presets */}
          <Accordion type="single" collapsible>
            <AccordionItem value="presets" className="border-none">
              <AccordionTrigger className="text-sm py-2 hover:no-underline">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Info className="h-4 w-4" />
                  Snelle instellingen voor bekende providers
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {PRESETS.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      className="text-xs justify-start h-auto py-1.5"
                      onClick={() => applyPreset(preset)}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Email + Password */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="imap-email">E-mailadres *</Label>
              <Input
                id="imap-email"
                type="email"
                placeholder="jouw@bedrijf.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="imap-password">Wachtwoord *</Label>
              <Input
                id="imap-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Je wachtwoord wordt versleuteld opgeslagen (AES-256).
              </p>
            </div>
          </div>

          {/* IMAP settings */}
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-3 space-y-1.5">
              <Label htmlFor="imap-host">IMAP server *</Label>
              <Input
                id="imap-host"
                placeholder="mail.privateemail.com"
                value={imapHost}
                onChange={(e) => setImapHost(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="imap-port">Poort</Label>
              <Input
                id="imap-port"
                type="number"
                value={imapPort}
                onChange={(e) => setImapPort(e.target.value)}
              />
            </div>
          </div>

          {/* SMTP settings */}
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-3 space-y-1.5">
              <Label htmlFor="smtp-host">SMTP server *</Label>
              <Input
                id="smtp-host"
                placeholder="mail.privateemail.com"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="smtp-port">Poort</Label>
              <Input
                id="smtp-port"
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
              />
            </div>
          </div>

          {/* SSL Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="use-ssl" className="font-medium">SSL/TLS</Label>
              <p className="text-xs text-muted-foreground">Beveiligde verbinding (aanbevolen)</p>
            </div>
            <Switch id="use-ssl" checked={useSsl} onCheckedChange={setUseSsl} />
          </div>

          {/* Test result */}
          {testResult && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              testResult === 'success'
                ? 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20'
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}>
              {testResult === 'success'
                ? <CheckCircle className="h-4 w-4 flex-shrink-0" />
                : <AlertCircle className="h-4 w-4 flex-shrink-0" />
              }
              <span>{testResult === 'success' ? 'IMAP en SMTP verbinding succesvol!' : testError}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={isTesting || isConnecting}
              className="flex-1"
            >
              {isTesting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Verbinding testen
            </Button>
            <Button
              onClick={handleConnect}
              disabled={isConnecting || isTesting}
              className="flex-1"
            >
              {isConnecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Koppelen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
