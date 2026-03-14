import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { FAQSection } from '@/components/landing/FAQSection';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';

const plans = [
  {
    name: 'Starter',
    tier: 'starter',
    price: '9,99',
    description: 'Voor startende ondernemers',
    features: [
      'Tot 100 e-mails per maand',
      '50 AI-calls per maand',
      '1 gebruiker',
      'Basis financieel dashboard',
      'E-mail support',
    ],
    popular: false,
    cta: 'Probeer 14 dagen gratis',
  },
  {
    name: 'Pro',
    tier: 'pro',
    price: '29,99',
    description: 'Meest gekozen door ZZP\'ers',
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
    cta: 'Start gratis proefperiode',
  },
  {
    name: 'Business',
    tier: 'business',
    price: '79,99',
    description: 'Voor groeiende MKB\'s',
    features: [
      'Alles uit Pro',
      'Onbeperkte gebruikers',
      'Priority SLA (4 uur)',
      'Geavanceerde automatiseringen',
      'API-toegang & integraties',
      'Dedicated accountmanager',
      'Op-maat onboarding',
    ],
    popular: false,
    cta: 'Neem contact op',
  },
];

export default function MarketingPricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createCheckoutSession } = useSubscription();

  const handlePlanClick = async (tier: string) => {
    if (!user) {
      navigate('/signup');
      return;
    }
    toast.info('Checkout sessie wordt geopend...');
    await createCheckoutSession(tier);
  };

  return (
    <>
      <Helmet>
        <title>Prijzen - Betaalbare AI Software voor ZZP & MKB | Servio</title>
        <meta 
          name="description" 
          content="Transparante prijzen voor elke ondernemer. Vanaf €9,99/maand. 14 dagen gratis proberen, geen creditcard nodig. Kies Starter, Pro of Business." 
        />
        <meta 
          name="keywords" 
          content="bedrijfssoftware prijzen, boekhoudsoftware kosten, AI klantenservice prijs, ZZP software, MKB administratie software" 
        />
        <link rel="canonical" href="https://servio.nl/pricing" />
        
        <meta property="og:title" content="Prijzen - Betaalbare AI Software voor ZZP & MKB | Servio" />
        <meta property="og:description" content="Vanaf €9,99/maand. 14 dagen gratis, geen creditcard nodig." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://servio.nl/pricing" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingHeader />
        
        <main>
          {/* Hero */}
          <section className="pt-32 pb-16 md:pt-44 md:pb-20">
            <div className="container mx-auto px-6">
              <div className="max-w-3xl mx-auto text-center">
                <span className="text-sm font-medium text-primary mb-4 block">Prijzen</span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.02em] text-foreground mb-6 leading-tight">
                  Betaalbaar voor elke
                  <br />
                  <span className="text-primary">ondernemer.</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8">
                  Geen verrassingen, geen verborgen kosten. 
                  Kies het plan dat bij jou past en start vandaag nog gratis.
                </p>
                
                {/* Trust indicators */}
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                  {[
                    '14 dagen gratis proberen',
                    'Geen creditcard nodig',
                    'Maandelijks opzegbaar',
                  ].map((item, i) => (
                    <span key={i} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Pricing cards */}
          <section className="pb-24 md:pb-32">
            <div className="container mx-auto px-6">
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {plans.map((plan, index) => (
                  <article 
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

                    <header className="mb-6">
                      <h2 className={`text-xl font-semibold mb-1 ${plan.popular ? 'text-background' : 'text-foreground'}`}>
                        {plan.name}
                      </h2>
                      <p className={`text-sm ${plan.popular ? 'text-background/70' : 'text-muted-foreground'}`}>
                        {plan.description}
                      </p>
                    </header>

                    <div className="mb-6">
                      <span className={`text-4xl font-semibold ${plan.popular ? 'text-background' : 'text-foreground'}`}>
                        €{plan.price}
                      </span>
                      <span className={`text-sm ${plan.popular ? 'text-background/70' : 'text-muted-foreground'}`}>/maand</span>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-background/70' : 'text-success'}`} />
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
                      variant={plan.popular ? 'secondary' : 'default'}
                      onClick={() => navigate('/signup')}
                    >
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </article>
                ))}
              </div>

              {/* Enterprise callout */}
              <div className="mt-16 max-w-2xl mx-auto">
                <div className="rounded-xl border border-border/40 bg-muted/30 p-8 text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Enterprise oplossing nodig?
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Voor grotere organisaties bieden we maatwerk met dedicated support, SLA en custom integraties.
                  </p>
                  <Button variant="outline" onClick={() => window.location.href = 'mailto:sales@servio.nl'}>
                    Neem contact op
                  </Button>
                </div>
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
