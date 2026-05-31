import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { FAQSection } from '@/components/landing/FAQSection';
import { SeoHead } from '@/components/SeoHead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, ArrowRight, CheckCircle2, Quote, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/components/AuthProvider';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type BillingCycle = 'monthly' | 'yearly';

const YEARLY_PRICE_IDS: Record<string, string> = {
  starter: 'price_1Td9yCDME8sDkzM9SMtJR6aP',
  pro: 'price_1TdA0ZDME8sDkzM9ePwqBEIG',
  business: 'price_1TdA1TDME8sDkzM9f24n5ANg',
};

const PLANS = [
  {
    tier: 'starter',
    name: 'Starter',
    description: 'Voor net startende ZZP\'ers',
    monthly: 9.99,
    yearlyMonthly: 8.32,
    yearlyTotal: 99.99,
    yearlySavings: 19.89,
    cta: 'Start gratis',
    popular: false,
    features: [
      '100 e-mails per maand',
      '50 AI-calls per maand',
      '1 gebruiker',
      'AI antwoordsuggesties',
      'Basis inbox automatisering',
      'Factuurverwerking',
    ],
  },
  {
    tier: 'pro',
    name: 'Pro',
    description: 'Meest gekozen door ZZP\'ers',
    monthly: 29.99,
    yearlyMonthly: 24.99,
    yearlyTotal: 299.99,
    yearlySavings: 59.89,
    cta: 'Start gratis',
    popular: true,
    features: [
      'Onbeperkt e-mails',
      'Onbeperkt AI-calls',
      '3 gebruikers',
      'AI Boekhoudassistent',
      'Offertes & klantenbeheer',
      'Urenregistratie',
      'Geavanceerde rapportages',
      'Priority support',
    ],
  },
  {
    tier: 'business',
    name: 'Business',
    description: 'Voor groeiende teams',
    monthly: 79.99,
    yearlyMonthly: 66.66,
    yearlyTotal: 799.99,
    yearlySavings: 159.89,
    cta: 'Start gratis',
    popular: false,
    features: [
      'Onbeperkte gebruikers',
      'API toegang',
      'Dedicated accountmanager',
      'Priority SLA (4 uur)',
      'Op-maat onboarding',
      'Alles uit Pro',
    ],
  },
];

const TESTIMONIALS = [
  {
    quote: 'Ik bespaar makkelijk 6 uur per week. De AI antwoorden zijn verrassend goed en ik hoef ze bijna nooit aan te passen.',
    name: 'Lars van den Berg',
    role: 'Freelance designer, Amsterdam',
  },
  {
    quote: 'Eindelijk één plek voor mijn facturen, emails en financiën. Had dit jaren geleden al gewild.',
    name: 'Mira Janssen',
    role: 'ZZP Marketingconsultant',
  },
  {
    quote: 'De BTW reminder alleen al is het geld waard. Nooit meer vergeten aangifte te doen.',
    name: 'Thomas de Wit',
    role: 'Zelfstandig boekhouder',
  },
];

type Cell = string | boolean;
const COMPARISON: { feature: string; starter: Cell; pro: Cell; business: Cell; key?: boolean }[] = [
  { feature: 'E-mails per maand', starter: '100', pro: 'Onbeperkt', business: 'Onbeperkt', key: true },
  { feature: 'AI-calls per maand', starter: '50', pro: 'Onbeperkt', business: 'Onbeperkt', key: true },
  { feature: 'Gebruikers', starter: '1', pro: '3', business: 'Onbeperkt', key: true },
  { feature: 'AI antwoordsuggesties', starter: true, pro: true, business: true, key: true },
  { feature: 'Inbox automatisering', starter: 'Basis', pro: 'Volledig', business: 'Volledig' },
  { feature: 'Factuurverwerking', starter: true, pro: true, business: true, key: true },
  { feature: 'Financieel dashboard', starter: 'Basis', pro: 'Volledig', business: 'Volledig' },
  { feature: 'AI Boekhoudassistent', starter: false, pro: true, business: true, key: true },
  { feature: 'Offertes', starter: false, pro: true, business: true },
  { feature: 'Klantenbeheer', starter: false, pro: true, business: true },
  { feature: 'Urenregistratie', starter: false, pro: true, business: true, key: true },
  { feature: 'Geavanceerde rapportages', starter: false, pro: true, business: true },
  { feature: 'Exports (PDF/Excel/ZIP)', starter: false, pro: true, business: true },
  { feature: 'Priority support', starter: false, pro: true, business: true, key: true },
  { feature: 'API toegang', starter: false, pro: false, business: true },
  { feature: 'Dedicated accountmanager', starter: false, pro: false, business: true },
  { feature: 'Priority SLA (4 uur)', starter: false, pro: false, business: true },
  { feature: 'Op-maat onboarding', starter: false, pro: false, business: true },
];

function renderCell(v: Cell) {
  if (v === true) return <Check className="w-5 h-5 text-success mx-auto" aria-label="Ja" />;
  if (v === false) return <X className="w-5 h-5 text-muted-foreground/50 mx-auto" aria-label="Nee" />;
  return <span className="text-sm text-foreground">{v}</span>;
}

export default function MarketingPricing() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const { user } = useAuth();
  const { createCheckoutSession } = useSubscription();
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const handlePlanClick = async (tier: string) => {
    if (!user) {
      navigate('/signup');
      return;
    }
    toast.info('Checkout...');
    await createCheckoutSession(tier, billing);
  };

  const title = isEn
    ? 'Pricing – From €9.99 per month | Servio AI Business Assistant'
    : 'Prijzen – Vanaf €9,99 per maand | Servio AI Bedrijfsassistent';
  const description = isEn
    ? 'Transparent pricing for every entrepreneur. From €9.99/month. 14-day free trial, no credit card required.'
    : 'Transparante prijzen voor elke ondernemer. Vanaf €9,99/maand. 14 dagen gratis proberen, geen creditcard nodig.';

  const visibleFeatures = showAllFeatures ? COMPARISON : COMPARISON.filter(c => c.key);

  return (
    <>
      <SeoHead path="/pricing" title={title} description={description} />

      <div className="min-h-screen bg-background">
        <LandingHeader />

        <main>
          <section className="pt-32 pb-12 md:pt-44 md:pb-16">
            <div className="container mx-auto px-6">
              <div className="max-w-3xl mx-auto text-center">
                <span className="text-sm font-medium text-primary mb-4 block">Prijzen</span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.02em] text-foreground mb-6 leading-tight">
                  Transparante prijzen,
                  <br />
                  <span className="text-primary">geen verrassingen</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8">
                  Kies het plan dat bij je past. 14 dagen gratis proberen, geen creditcard nodig.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-6 text-sm mb-10">
                  {['14 dagen gratis', 'Geen creditcard nodig', 'Op elk moment opzegbaar'].map((item, i) => (
                    <span key={i} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      {item}
                    </span>
                  ))}
                </div>

                {/* Billing toggle */}
                <div className="inline-flex flex-wrap items-center gap-3 justify-center">
                  <div className="inline-flex items-center bg-muted rounded-full p-1 relative">
                    <button
                      type="button"
                      onClick={() => setBilling('monthly')}
                      className={cn(
                        'relative z-10 px-5 py-2 rounded-full text-sm font-medium transition-colors duration-300',
                        billing === 'monthly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      )}
                      aria-pressed={billing === 'monthly'}
                    >
                      Maandelijks
                    </button>
                    <button
                      type="button"
                      onClick={() => setBilling('yearly')}
                      className={cn(
                        'relative z-10 px-5 py-2 rounded-full text-sm font-medium transition-colors duration-300',
                        billing === 'yearly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      )}
                      aria-pressed={billing === 'yearly'}
                    >
                      Jaarlijks
                    </button>
                  </div>
                  <Badge className="bg-success/15 text-success hover:bg-success/20 border-0">
                    2 maanden gratis
                  </Badge>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing cards */}
          <section className="pb-20">
            <div className="container mx-auto px-6">
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {PLANS.map((plan) => {
                  const isYearly = billing === 'yearly';
                  const displayMonthly = isYearly ? plan.yearlyMonthly : plan.monthly;
                  return (
                    <article
                      key={plan.tier}
                      className={cn(
                        'relative rounded-2xl p-8 transition-all duration-300',
                        plan.popular
                          ? 'bg-foreground text-background border-2 border-foreground shadow-2xl md:scale-[1.03]'
                          : 'bg-card border border-border/40 hover:border-border hover:shadow-elevated'
                      )}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                          <span className="inline-flex px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium whitespace-nowrap">
                            Meest gekozen
                          </span>
                        </div>
                      )}

                      <header className="mb-6">
                        <h2 className={cn('text-xl font-semibold mb-1', plan.popular ? 'text-background' : 'text-foreground')}>
                          {plan.name}
                        </h2>
                        <p className={cn('text-sm', plan.popular ? 'text-background/70' : 'text-muted-foreground')}>
                          {plan.description}
                        </p>
                      </header>

                      <div className="mb-6 min-h-[88px]">
                        <div className="flex items-baseline gap-2">
                          {isYearly && (
                            <span className={cn('text-lg line-through', plan.popular ? 'text-background/40' : 'text-muted-foreground/60')}>
                              €{plan.monthly.toFixed(2).replace('.', ',')}
                            </span>
                          )}
                          <span className={cn('text-4xl font-semibold transition-all', plan.popular ? 'text-background' : 'text-foreground')}>
                            €{displayMonthly.toFixed(2).replace('.', ',')}
                          </span>
                          <span className={cn('text-sm', plan.popular ? 'text-background/70' : 'text-muted-foreground')}>/maand</span>
                        </div>
                        {isYearly && (
                          <p className={cn('text-xs mt-2', plan.popular ? 'text-background/70' : 'text-muted-foreground')}>
                            Gefactureerd als €{plan.yearlyTotal.toFixed(2).replace('.', ',')}/jaar · Bespaar €{plan.yearlySavings.toFixed(2).replace('.', ',')}
                          </p>
                        )}
                      </div>

                      <ul className="space-y-3 mb-8">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm">
                            <Check className={cn('w-4 h-4 flex-shrink-0 mt-0.5', plan.popular ? 'text-background/70' : 'text-success')} />
                            <span className={plan.popular ? 'text-background/90' : 'text-foreground'}>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className={cn(
                          'w-full h-12 rounded-xl text-sm font-medium',
                          plan.popular && 'bg-background text-foreground hover:bg-background/90'
                        )}
                        variant={plan.popular ? 'secondary' : 'default'}
                        onClick={() => handlePlanClick(plan.tier)}
                      >
                        {plan.cta}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="py-16 md:py-20">
            <div className="container mx-auto px-6">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-center text-foreground mb-12">
                Wat ondernemers zeggen over Servio
              </h2>
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {TESTIMONIALS.map((tm, i) => (
                  <div key={i} className="relative rounded-2xl bg-muted/40 border border-border/40 p-6 md:p-7">
                    <Quote className="absolute top-5 left-5 w-7 h-7 text-primary/20" aria-hidden />
                    <div className="pl-10">
                      <div className="flex gap-0.5 mb-3" aria-label="5 sterren">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-foreground text-[15px] leading-relaxed mb-5">"{tm.quote}"</p>
                      <div>
                        <p className="font-medium text-foreground text-sm">{tm.name}</p>
                        <p className="text-xs text-muted-foreground">{tm.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Comparison table */}
          <section className="py-16 md:py-20">
            <div className="container mx-auto px-6">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-center text-foreground mb-3">
                Wat zit er in elk plan?
              </h2>
              <p className="text-muted-foreground text-center mb-12">
                Een volledige vergelijking van alle features per plan.
              </p>

              <div className="max-w-5xl mx-auto overflow-x-auto rounded-2xl border border-border/40 bg-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="text-left p-4 md:p-5 font-medium text-muted-foreground w-2/5">Feature</th>
                      <th className="p-4 md:p-5 font-semibold text-foreground text-center">Starter</th>
                      <th className="p-4 md:p-5 font-semibold text-center bg-[#2563eb] text-white relative">
                        Pro
                        <span className="block text-[10px] font-normal text-white/80 mt-0.5">Meest gekozen</span>
                      </th>
                      <th className="p-4 md:p-5 font-semibold text-foreground text-center">Business</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleFeatures.map((row, i) => (
                      <tr key={i} className="border-b border-border/30 last:border-0">
                        <td className="p-4 md:p-5 text-foreground">{row.feature}</td>
                        <td className="p-4 md:p-5 text-center">{renderCell(row.starter)}</td>
                        <td className="p-4 md:p-5 text-center bg-[#2563eb]/5">{renderCell(row.pro)}</td>
                        <td className="p-4 md:p-5 text-center">{renderCell(row.business)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile/quick toggle: show all */}
              <div className="text-center mt-6 md:hidden">
                <Button variant="outline" onClick={() => setShowAllFeatures(v => !v)}>
                  {showAllFeatures ? 'Toon belangrijkste features' : 'Toon alle features'}
                </Button>
              </div>
              <div className="text-center mt-6 hidden md:block">
                {!showAllFeatures && (
                  <Button variant="ghost" onClick={() => setShowAllFeatures(true)}>
                    Toon alle features
                  </Button>
                )}
              </div>
            </div>
          </section>

          {/* Enterprise contact */}
          <section className="pb-24">
            <div className="container mx-auto px-6">
              <div className="mt-4 max-w-2xl mx-auto">
                <div className="rounded-xl border border-border/40 bg-muted/30 p-8 text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Iets groters nodig?
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Voor grotere teams of specifieke wensen maken we graag een offerte op maat.
                  </p>
                  <Button variant="outline" onClick={() => window.location.href = 'mailto:info@getservio.co'}>
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
