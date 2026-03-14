import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';

const plans = [
  {
    name: 'Starter',
    price: '9,99',
    description: 'Perfect om te starten',
    features: [
      'Beperkte inbox',
      'Beperkte AI-calls',
      '1 gebruiker',
      'Basis rapportages',
    ],
    popular: false,
  },
  {
    name: 'Pro',
    price: '29,99',
    description: 'Meest gekozen door ondernemers',
    features: [
      'Onbeperkte inbox',
      'Volledige administratie module',
      'AI boekhoudassistent',
      'Tot 3 gebruikers',
      'Geavanceerde rapportages',
      'Prioriteit support',
    ],
    popular: true,
  },
  {
    name: 'Business',
    price: '79,99',
    description: 'Voor groeiende bedrijven',
    features: [
      'Alle functies',
      'Onbeperkte gebruikers',
      'Priority SLA',
      'Automatiseringen',
      'Custom integraties',
      'Dedicated support',
    ],
    popular: false,
  },
];

export function PricingSection() {
  const navigate = useNavigate();

  return (
    <section className="py-24 md:py-32" id="pricing">
      <div className="container mx-auto px-6">
        <div className="max-w-xl mx-auto text-center mb-16 animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-foreground mb-4">
            Eenvoudige, transparante prijzen
          </h2>
          <p className="text-muted-foreground">
            Kies het plan dat bij jou past. Altijd 14 dagen gratis proberen.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`relative rounded-xl p-6 transition-all duration-300 animate-fade-in-up group ${
                plan.popular 
                  ? 'bg-foreground text-background border-2 border-foreground shadow-xl scale-[1.02]' 
                  : 'bg-card border border-border/40 hover:border-border hover:shadow-elevated'
              }`}
              style={{ animationDelay: `${(index + 1) * 100}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium animate-pulse">
                    Meest populair
                  </span>
                </div>
              )}

              <div className="mb-5">
                <h3 className={`text-lg font-medium mb-0.5 ${plan.popular ? 'text-background' : 'text-foreground'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${plan.popular ? 'text-background/70' : 'text-muted-foreground'}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-5">
                <span className={`text-3xl font-semibold ${plan.popular ? 'text-background' : 'text-foreground'}`}>
                  €{plan.price}
                </span>
                <span className={`text-sm ${plan.popular ? 'text-background/70' : 'text-muted-foreground'}`}>/maand</span>
              </div>

              {/* Trial badge */}
              <div className={`mb-5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                plan.popular 
                  ? 'bg-background/20 text-background' 
                  : 'bg-success/10 text-success'
              }`}>
                <Check className="w-3 h-3" />
                14 dagen gratis
              </div>

              <ul className="space-y-2.5 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm">
                    <Check className={`w-3.5 h-3.5 flex-shrink-0 ${plan.popular ? 'text-background/70' : 'text-muted-foreground'}`} />
                    <span className={plan.popular ? 'text-background/90' : 'text-muted-foreground'}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className={`w-full h-10 rounded-lg text-sm font-medium transition-all duration-300 ${
                  plan.popular 
                    ? 'bg-background text-foreground hover:bg-background/90 hover:scale-[1.02]' 
                    : 'hover:scale-[1.02]'
                }`}
                variant={plan.popular ? 'secondary' : 'outline'}
                onClick={() => navigate('/signup')}
              >
                Start Gratis
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}