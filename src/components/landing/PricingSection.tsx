import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Eenvoudige, transparante prijzen
          </h2>
          <p className="text-lg text-muted-foreground">
            Kies het plan dat bij jou past. Altijd 14 dagen gratis proberen.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`relative rounded-2xl p-8 ${
                plan.popular 
                  ? 'bg-card border-2 border-primary shadow-xl scale-105' 
                  : 'bg-card border border-border/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-lg">
                    <Sparkles className="w-4 h-4" />
                    Meest populair
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">€{plan.price}</span>
                <span className="text-muted-foreground">/maand</span>
              </div>

              {/* Trial badge */}
              <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium">
                <Check className="w-4 h-4" />
                14 dagen gratis
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full" 
                variant={plan.popular ? 'default' : 'outline'}
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
