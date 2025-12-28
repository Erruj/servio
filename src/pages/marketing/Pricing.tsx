import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { FAQSection } from '@/components/landing/FAQSection';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const plans = [
  {
    name: 'Starter',
    price: '9,99',
    description: 'Perfect om te starten',
    features: [
      'Tot 100 e-mails per maand',
      '50 AI-calls per maand',
      '1 gebruiker',
      'Basis rapportages',
      'E-mail support',
    ],
    popular: false,
  },
  {
    name: 'Pro',
    price: '29,99',
    description: 'Meest gekozen door ondernemers',
    features: [
      'Onbeperkte e-mails',
      'Onbeperkte AI-calls',
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
      'Alles uit Pro',
      'Onbeperkte gebruikers',
      'Priority SLA (4 uur)',
      'Geavanceerde automatiseringen',
      'Custom integraties',
      'Dedicated accountmanager',
      'On-boarding training',
    ],
    popular: false,
  },
];

export default function MarketingPricing() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Prijzen - Servio</title>
        <meta name="description" content="Eenvoudige, transparante prijzen. Kies het plan dat bij jou past. Altijd 14 dagen gratis proberen." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingHeader />
        
        <main>
          {/* Hero */}
          <section className="pt-32 pb-20 md:pt-44 md:pb-28">
            <div className="container mx-auto px-6">
              <div className="max-w-3xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.02em] text-foreground mb-6 leading-tight">
                  Eenvoudige,
                  <br />
                  <span className="text-primary">transparante prijzen.</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
                  Kies het plan dat bij jou past. Altijd 14 dagen gratis proberen, geen creditcard nodig.
                </p>
              </div>
            </div>
          </section>

          {/* Pricing cards */}
          <section className="pb-24 md:pb-32">
            <div className="container mx-auto px-6">
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {plans.map((plan, index) => (
                  <div 
                    key={index}
                    className={`relative rounded-2xl p-8 transition-all duration-300 ${
                      plan.popular 
                        ? 'bg-foreground text-background border-2 border-foreground shadow-2xl scale-[1.02]' 
                        : 'bg-card border border-border/40 hover:border-border hover:shadow-elevated'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className="inline-flex px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                          Meest populair
                        </span>
                      </div>
                    )}

                    <div className="mb-6">
                      <h3 className={`text-xl font-semibold mb-1 ${plan.popular ? 'text-background' : 'text-foreground'}`}>
                        {plan.name}
                      </h3>
                      <p className={`text-sm ${plan.popular ? 'text-background/70' : 'text-muted-foreground'}`}>
                        {plan.description}
                      </p>
                    </div>

                    <div className="mb-6">
                      <span className={`text-4xl font-semibold ${plan.popular ? 'text-background' : 'text-foreground'}`}>
                        €{plan.price}
                      </span>
                      <span className={`text-sm ${plan.popular ? 'text-background/70' : 'text-muted-foreground'}`}>/maand</span>
                    </div>

                    {/* Trial badge */}
                    <div className={`mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                      plan.popular 
                        ? 'bg-background/20 text-background' 
                        : 'bg-success/10 text-success'
                    }`}>
                      <Check className="w-4 h-4" />
                      14 dagen gratis proberen
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-background/70' : 'text-primary'}`} />
                          <span className={plan.popular ? 'text-background/90' : 'text-foreground'}>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      className={`w-full h-12 rounded-xl text-sm font-medium ${
                        plan.popular 
                          ? 'bg-background text-foreground hover:bg-background/90' 
                          : ''
                      }`}
                      variant={plan.popular ? 'secondary' : 'outline'}
                      onClick={() => navigate('/signup')}
                    >
                      Start Gratis
                    </Button>
                  </div>
                ))}
              </div>

              {/* Enterprise callout */}
              <div className="mt-12 max-w-2xl mx-auto text-center">
                <p className="text-muted-foreground">
                  Grotere organisatie? <a href="mailto:sales@servio.nl" className="text-primary hover:underline">Neem contact op</a> voor maatwerk.
                </p>
              </div>
            </div>
          </section>

          <FAQSection />
        </main>
        
        <LandingFooter />
      </div>
    </>
  );
}
