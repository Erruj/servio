import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles, Mail, Building2, Rocket, ArrowRight,
  Inbox as InboxIcon, FileText, Wallet, CheckCircle2, Loader2,
} from 'lucide-react';

type Step = 0 | 1 | 2 | 3; // 0 = welcome, 1 = mailbox, 2 = profile, 3 = first action

export function OnboardingWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(0);
  const [hasMailbox, setHasMailbox] = useState(false);
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, company_name, vat_number, phone, onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile || profile.onboarding_completed) return;

      setFullName(profile.full_name || '');
      setCompanyName(profile.company_name || '');
      setVatNumber(profile.vat_number || '');
      setPhone(profile.phone || '');

      const { count } = await supabase
        .from('email_connections')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setHasMailbox((count || 0) > 0);
      setOpen(true);
    })();
  }, [user]);

  const totalSteps = 3;
  const stepIndex = step === 0 ? 0 : step; // welcome shows progress 0
  const progress = step === 0 ? 0 : ((step - 1) / totalSteps) * 100;

  const finish = async () => {
    if (!user) return;
    await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id);
    setOpen(false);
  };

  const skipMailbox = () => setStep(2);

  const goToMailboxSetup = () => {
    setOpen(false);
    navigate('/mailbox-setup');
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName || null,
        company_name: companyName || null,
        vat_number: vatNumber || null,
        phone: phone || null,
      })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Opslaan mislukt', description: error.message, variant: 'destructive' });
      return;
    }
    setStep(3);
  };

  const firstActions = [
    { icon: InboxIcon, label: 'Bekijk mijn inbox', desc: 'Lees, beantwoord en sorteer met AI', href: '/app' },
    { icon: FileText, label: 'Upload mijn eerste factuur', desc: 'Laat AI het automatisch verwerken', href: '/administration/invoices' },
    { icon: Wallet, label: 'Bekijk financieel overzicht', desc: 'Direct inzicht in omzet en kosten', href: '/administration/overview' },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) finish(); }}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 px-6 pt-6 pb-4">
          <DialogTitle className="sr-only">Welkom bij Servio</DialogTitle>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Onboarding · Stap {Math.max(1, step)} van {totalSteps}
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <div className="p-6 space-y-5">
          {step === 0 && (
            <div className="space-y-4 text-center py-4">
              <h2 className="text-2xl font-bold">
                Welkom bij Servio{fullName ? `, ${fullName.split(' ')[0]}` : ''}! 👋
              </h2>
              <p className="text-muted-foreground">
                Laten we je in 3 stappen klaarstomen. Het duurt minder dan 2 minuten.
              </p>
              <Button size="lg" onClick={() => setStep(hasMailbox ? 2 : 1)} className="mt-2">
                Aan de slag <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg"><Mail className="h-5 w-5 text-primary" /></div>
                <div>
                  <h2 className="text-xl font-semibold">Koppel je mailbox</h2>
                  <p className="text-sm text-muted-foreground">
                    Servio leest, sorteert en beantwoordt je emails automatisch.
                  </p>
                </div>
              </div>

              <Card className="border-dashed">
                <CardContent className="p-6 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Open de mailbox-instellingen om je Gmail, Outlook of IMAP-account te koppelen.
                  </p>
                  <Button onClick={goToMailboxSetup}>
                    Mailbox koppelen <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              <div className="flex justify-between pt-2">
                <Button variant="ghost" size="sm" onClick={skipMailbox} className="text-muted-foreground text-xs">
                  Sla over
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                  Volgende →
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg"><Building2 className="h-5 w-5 text-primary" /></div>
                <div>
                  <h2 className="text-xl font-semibold">Bedrijfsprofiel</h2>
                  <p className="text-sm text-muted-foreground">
                    Dit gebruiken we voor je facturen en offertes.
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                <div>
                  <Label htmlFor="ob-company">Bedrijfsnaam *</Label>
                  <Input id="ob-company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Servio B.V." />
                </div>
                <div>
                  <Label htmlFor="ob-vat">BTW-nummer (optioneel)</Label>
                  <Input id="ob-vat" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} placeholder="NL123456789B01" />
                </div>
                <div>
                  <Label htmlFor="ob-phone">Telefoon (optioneel)</Label>
                  <Input id="ob-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+31 6 12345678" />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="ghost" size="sm" onClick={() => setStep(3)} className="text-muted-foreground text-xs">
                  Sla over
                </Button>
                <Button onClick={saveProfile} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Opslaan & verder
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg"><Rocket className="h-5 w-5 text-primary" /></div>
                <div>
                  <h2 className="text-xl font-semibold">Wat wil je als eerste doen?</h2>
                  <p className="text-sm text-muted-foreground">Kies een actie om direct te starten.</p>
                </div>
              </div>

              <div className="grid gap-3">
                {firstActions.map((a) => {
                  const Icon = a.icon;
                  return (
                    <Card
                      key={a.href}
                      className="cursor-pointer hover:border-primary hover:shadow-card transition-all"
                      onClick={async () => { await finish(); navigate(a.href); }}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{a.label}</div>
                          <div className="text-xs text-muted-foreground">{a.desc}</div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="ghost" size="sm" onClick={finish} className="text-muted-foreground text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Setup afronden
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
