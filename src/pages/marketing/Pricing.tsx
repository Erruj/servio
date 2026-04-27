import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { FAQSection } from '@/components/landing/FAQSection';
import { SeoHead } from '@/components/SeoHead';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/components/AuthProvider';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';

export default function MarketingPricing() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const { user } = useAuth();
  const { createCheckoutSession } = useSubscription();

  const plans = (t('marketing.pricing.plansFull', { returnObjects: true }) as Array<{
    name: string; tier: string; price: string; description: string; features: string[]; cta: string;
  }>).map((p, i) => ({ ...p, popular: i === 1 }));

  const trust = [
    t('marketing.pricing.trust1'),
    t('marketing.pricing.trust2'),
    t('marketing.pricing.trust3'),
  ];

  const handlePlanClick = async (tier: string) => {
    if (!user) {
      navigate('/signup');
      return;
    }
    toast.info('Checkout...');
    await createCheckoutSession(tier);
  };

  const title = isEn
    ? 'Pricing – From €9.99 per month | Servio AI Business Assistant'
    : 'Prijzen – Vanaf €9,99 per maand | Servio AI Bedrijfsassistent';
  const description = isEn
    ? 'Transparent pricing for every entrepreneur. From €9.99/month. 14-day free trial, no credit card required. Choose Starter, Pro or Business.'
    : 'Transparante prijzen voor elke ondernemer. Vanaf €9,99/maand. 14 dagen gratis proberen, geen creditcard nodig. Kies Starter, Pro of Business.';

  return (
    <>
      <SeoHead path="/pricing" title={title} description={description} />

      <div className="min-h-screen bg-background">
        <LandingHeader />

        <main>
          <section className="pt-32 pb-16 md:pt-44 md:pb-20">
            <div className="container mx-auto px-6">
              <div className="max-w-3xl mx-auto text-center">
                <span className="text-sm font-medium text-primary mb-4 block">{t('marketing.pricing.eyebrow')}</span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.02em] text-foreground mb-6 leading-tight">
                  {t('marketing.pricing.h1Top')}
                  <br />
                  <span className="text-primary">{t('marketing.pricing.h1Bottom')}</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8">
                  {t('marketing.pricing.subtitle')}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                  {trust.map((item, i) => (
                    <span key={i} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

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
                          {t('marketing.pricing.mostPopular')}
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
                      <span className={`text-sm ${plan.popular ? 'text-background/70' : 'text-muted-foreground'}`}>{t('marketing.pricing.perMonth')}</span>
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
                        plan.popular ? 'bg-background text-foreground hover:bg-background/90' : ''
                      }`}
                      variant={plan.popular ? 'secondary' : 'default'}
                      onClick={() => handlePlanClick(plan.tier)}
                    >
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </article>
                ))}
              </div>

              <div className="mt-16 max-w-2xl mx-auto">
                <div className="rounded-xl border border-border/40 bg-muted/30 p-8 text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {t('marketing.pricing.enterpriseTitle')}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {t('marketing.pricing.enterpriseDesc')}
                  </p>
                  <Button variant="outline" onClick={() => window.location.href = 'mailto:info@getservio.co'}>
                    {t('marketing.pricing.contactUs')}
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
