import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Settings, Brain, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface OnboardingStep {
  icon: React.ElementType;
  title: string;
  description: string;
  action: string;
  href: string;
}

const steps: OnboardingStep[] = [
  {
    icon: Mail,
    title: 'Koppel je mailbox',
    description: 'Verbind je Gmail of Outlook om emails te synchroniseren en met AI te beantwoorden.',
    action: 'Mailbox koppelen',
    href: '/mailbox-setup',
  },
  {
    icon: Settings,
    title: 'Stel je voorkeuren in',
    description: 'Kies je taal, communicatiestijl en AI instellingen.',
    action: 'Instellingen openen',
    href: '/settings',
  },
  {
    icon: Brain,
    title: 'Ontdek de AI Inbox',
    description: 'Open je inbox en laat de AI slimme antwoorden genereren op basis van je emails.',
    action: 'Naar inbox',
    href: '/app',
  },
];

export function OnboardingDialog() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Check if user has seen onboarding (created less than 5 minutes ago)
    const checkOnboarding = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      const createdAt = new Date(profile.created_at);
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

      // Show onboarding only for very new users (created in last 5 min)
      // and check if they have any email connections yet
      if (createdAt > fiveMinAgo) {
        const { count } = await supabase
          .from('email_connections')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (count === 0) {
          setOpen(true);
        }
      }
    };

    checkOnboarding();
  }, [user]);

  const handleStepAction = (href: string) => {
    setOpen(false);
    navigate(href);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <div className="text-center mb-6">
          <div className="p-3 bg-primary/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Welkom bij Servio! 🎉</h2>
          <p className="text-muted-foreground mt-2">
            Begin in 3 eenvoudige stappen met je AI-powered klantenservice.
          </p>
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <Card 
                key={index} 
                className={`transition-all ${isCurrent ? 'border-primary shadow-card' : 'border-border'}`}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    isCompleted ? 'bg-success/10' : isCurrent ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <Icon className={`h-5 w-5 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm">{step.title}</h3>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                  {isCurrent && (
                    <Button size="sm" onClick={() => handleStepAction(step.href)}>
                      {step.action}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-between mt-4">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Later
          </Button>
          {currentStep > 0 && (
            <Button variant="outline" size="sm" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}>
              Vorige
            </Button>
          )}
          {currentStep < steps.length - 1 && (
            <Button variant="outline" size="sm" onClick={() => setCurrentStep(currentStep + 1)}>
              Volgende
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
