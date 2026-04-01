import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Settings, Brain, ArrowRight, CheckCircle, Sparkles, FileText, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface OnboardingStep {
  icon: React.ElementType;
  title: string;
  description: string;
  action: string;
  href: string;
  completed?: boolean;
}

export function OnboardingDialog() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const steps: OnboardingStep[] = [
    {
      icon: Mail,
      title: 'Koppel je mailbox',
      description: 'Verbind je Gmail, Outlook of een ander e-mailaccount om emails te synchroniseren en met AI te beantwoorden.',
      action: 'Mailbox koppelen',
      href: '/mailbox-setup',
    },
    {
      icon: Settings,
      title: 'Stel je voorkeuren in',
      description: 'Kies je taal, AI-toon en communicatiestijl zodat antwoorden bij je passen.',
      action: 'Instellingen openen',
      href: '/settings',
    },
    {
      icon: Brain,
      title: 'Ontdek de AI Inbox',
      description: 'Open je inbox en laat de AI slimme antwoorden genereren. Keur goed met één klik.',
      action: 'Naar inbox',
      href: '/app',
    },
    {
      icon: FileText,
      title: 'Upload je eerste document',
      description: 'Upload een factuur of bonnetje en laat de AI het automatisch analyseren en categoriseren.',
      action: 'Documenten openen',
      href: '/administration/documents',
    },
  ];

  useEffect(() => {
    if (!user) return;

    const checkOnboarding = async () => {
      // Check localStorage first for dismissed state
      const dismissed = localStorage.getItem(`onboarding_dismissed_${user.id}`);
      if (dismissed) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      const createdAt = new Date(profile.created_at);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      // Show onboarding for users created in the last hour
      if (createdAt > oneHourAgo) {
        // Check completed steps
        const completed = new Set<number>();

        const { count: connectionCount } = await supabase
          .from('email_connections')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (connectionCount && connectionCount > 0) completed.add(0);

        const { count: docCount } = await supabase
          .from('documents')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (docCount && docCount > 0) completed.add(3);

        setCompletedSteps(completed);

        // Find first incomplete step
        const firstIncomplete = [0, 1, 2, 3].find(i => !completed.has(i)) ?? 0;
        setCurrentStep(firstIncomplete);

        if (completed.size < steps.length) {
          setOpen(true);
        }
      }
    };

    checkOnboarding();
  }, [user]);

  const handleStepAction = (href: string, stepIndex: number) => {
    setOpen(false);
    navigate(href);
  };

  const handleDismiss = () => {
    if (user) {
      localStorage.setItem(`onboarding_dismissed_${user.id}`, 'true');
    }
    setOpen(false);
  };

  const progress = (completedSteps.size / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 pb-4">
          <DialogTitle className="sr-only">Welkom bij Servio</DialogTitle>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-2xl font-bold text-foreground">Welkom bij Servio! 🎉</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Voltooi deze stappen om het meeste uit Servio te halen.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <Progress value={progress} className="flex-1 h-2" />
            <span className="text-xs font-medium text-muted-foreground">
              {completedSteps.size}/{steps.length}
            </span>
          </div>
        </div>

        {/* Steps */}
        <div className="p-4 space-y-2 max-h-[50vh] overflow-y-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = completedSteps.has(index);
            const isCurrent = index === currentStep;

            return (
              <Card 
                key={index}
                className={`transition-all cursor-pointer ${
                  isCurrent ? 'border-primary shadow-sm ring-1 ring-primary/20' : 
                  isCompleted ? 'border-accent/30 bg-accent/5' : 'border-border'
                }`}
                onClick={() => !isCompleted && setCurrentStep(index)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    isCompleted ? 'bg-accent/10' : isCurrent ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-accent" />
                    ) : (
                      <Icon className={`h-5 w-5 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-sm ${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {step.title}
                    </h3>
                    {isCurrent && (
                      <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                    )}
                  </div>
                  {isCurrent && !isCompleted && (
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); handleStepAction(step.href, index); }}>
                      {step.action}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 pt-0 flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-muted-foreground">
            Niet meer tonen
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
