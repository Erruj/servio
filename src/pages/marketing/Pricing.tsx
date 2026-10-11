import { GlowingEffect } from '@/components/aceternity/glowing-effect';
import { LampCTA, HomeBento } from '@/components/landing/HomeSections';
import { Reveal, StaggerGroup, StaggerItem } from '@/components/landing/motion';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { FAQSection } from '@/components/landing/FAQSection';
import { SeoHead } from '@/components/SeoHead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/components/AuthProvider';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type BillingCycle = 'monthly' | 'yearly';

const YEARLY_PRICE_IDS: Record<string, string> = {
  starter: 'price_1Td9yCDME8sDkzM9SMtJR6aP',
  pro: 'price_1TdA0ZDME8sDkzM9ePwqBEIG',
  business: 'price_1TdA1TDME8sDkzM9f24n5ANg',
};

// Prijzen en vlaggen blijven in code; alle zichtbare tekst komt uit i18n
// (marketing.pricing.page.plans, zelfde volgorde als PLAN_META).
const PLAN_META = [
  { tier: 'free', monthly: 0, yearlyMonthly: 0, yearlyTotal: 0, yearlySavings: 0, popular: false, isFree: true },
  { tier: 'starter', monthly: 9.99, yearlyMonthly: 8.32, yearlyTotal: 99.99, yearlySavings: 19.89, popular: false, isFree: false },
  { tier: 'pro', monthly: 29.99, yearlyMonthly: 24.99, yearlyTotal: 299.99, yearlySavings: 59.89, popular: true, isFree: false },
  { tier: 'business', monthly: 79.99, yearlyMonthly: 66.66, yearlyTotal: 799.99, yearlySavings: 159.89, popular: false, isFree: false },
] as const;

// Celwaardes: 'yes' | 'no' | i18n-sleutel (unlimited/basic/full) | letterlijke tekst.
// Rijnamen komen uit marketing.pricing.page.rows (zelfde volgorde).
type CellDef = 'yes' | 'no' | 'unlimited' | 'basic' | 'full' | (string & {});
const COMPARISON_DEF: { cells: [CellDef, CellDef, CellDef, CellDef]; key?: boolean }[] = [
  { cells: ['20', '100', 'unlimited', 'unlimited'], key: true },
  { cells: ['10', '50', 'unlimited', 'unlimited'], key: true },
  { cells: ['1', '1', '3', 'unlimited'], key: true },
  { cells: ['1', '2', '5', 'unlimited'], key: true },
  { cells: ['yes', 'yes', 'yes', 'yes'], key: true },
  { cells: ['basic', 'basic', 'full', 'full'] },
  { cells: ['no', 'yes', 'yes', 'yes'], key: true },
  { cells: ['basic', 'basic', 'full', 'full'] },
  { cells: ['no', 'no', 'yes', 'yes'], key: true },
  { cells: ['no', 'no', 'yes', 'yes'] },
  { cells: ['no', 'no', 'yes', 'yes'] },
  { cells: ['no', 'no', 'yes', 'yes'], key: true },
  { cells: ['no', 'no', 'yes', 'yes'] },
  { cells: ['no', 'no', 'yes', 'yes'] },
  { cells: ['no', 'no', 'yes', 'yes'], key: true },
];

interface PlanTexts {
  name: string;
  description: string;
  cta: string;
  features: string[];
}

export default function MarketingPricing() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { createCheckoutSession, checkSubscription, subscriptionStatus, openCustomerPortal } = useSubscription();
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const P = 'marketing.pricing.page';
  const planTexts = (t(`${P}.plans`, { returnObjects: true }) as PlanTexts[]) || [];
  const rowNames = (t(`${P}.rows`, { returnObjects: true }) as string[]) || [];

  const renderCell = (v: CellDef) => {
    if (v === 'yes') return <Check className="w-5 h-5 text-success mx-auto" aria-label={t(`${P}.yes`)} />;
    if (v === 'no') return <X className="w-5 h-5 text-muted-foreground mx-auto" aria-label={t(`${P}.no`)} />;
    if (v === 'unlimited' || v === 'basic' || v === 'full') {
      return <span className="text-sm text-foreground">{t(`${P}.${v}`)}</span>;
    }
    return <span className="text-sm text-foreground">{v}</span>;
  };

  const handlePlanClick = async (tier: string) => {
    if (!user) {
      navigate(tier === 'free' ? '/signup?plan=free' : '/signup');
      return;
    }
    if (tier === 'free') {
      // Betalende klanten mogen niet stil worden gedowngraded: hun Stripe-abonnement
      // loopt dan door terwijl ze features kwijtraken. Stuur ze naar het klantportaal.
      const hasPaidPlan =
        subscriptionStatus?.subscribed === true ||
        subscriptionStatus?.subscription_status === 'active';
      if (hasPaidPlan) {
        toast.info(t(`${P}.toastPaidDowngrade`));
        await openCustomerPortal();
        return;
      }
      try {
        const { error } = await (supabase.rpc as any)('choose_free_plan');
        if (error) throw error;
        await checkSubscription();
        toast.success(t(`${P}.toastFreeActivated`));
        navigate('/app');
      } catch (e: any) {
        console.error('Kon gratis plan niet activeren:', e);
        toast.error(t(`${P}.toastFreeError`));
      }
      return;
    }
    toast.info(t(`${P}.toastCheckout`));
    await createCheckoutSession(tier, billing);
  };

  const title = t(`${P}.seoTitle`);
  const description = t(`${P}.seoDescription`);

  const visibleRows = showAllFeatures ? COMPARISON_DEF : COMPARISON_DEF.filter(c => c.key);

  const faqItems = (t('marketing.faq.items', { returnObjects: true }) as Array<{ q: string; a: string }>) || [];
  const faqJsonLd = faqItems.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }
    : null;

  return (
    <>
      <SeoHead path="/pricing" title={title} description={description}>
        {faqJsonLd && (
          <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
        )}
      </SeoHead>

      <div className="min-h-screen bg-background">
        <LandingHeader />

        <main>
          <section className="relative overflow-hidden bg-[#F4F4F6] pt-32 pb-12 md:pt-44 md:pb-16">
<div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:24px_24px]" /><div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.16),transparent_60%)]" />
            <div className="container relative mx-auto px-6">
              <Reveal className="max-w-3xl mx-auto text-center">
                <span className="text-sm font-medium text-primary mb-4 block">{t('marketing.pricing.eyebrow')}</span>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-neutral-900 mb-6 leading-tight">
                  {t(`${P}.h1Top`)}
                  <br />
                  <span className="text-primary">{t(`${P}.h1Accent`)}</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8">
                  {t(`${P}.subtitle`)}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-6 text-sm mb-10">
                  {[t(`${P}.trust1`), t(`${P}.trust2`), t(`${P}.trust3`)].map((item, i) => (
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
                      {t(`${P}.monthly`)}
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
                      {t(`${P}.yearly`)}
                    </button>
                  </div>
                  <Badge className="bg-success/15 text-success hover:bg-success/20 border-0">
                    {t(`${P}.saveBadge`)}
                  </Badge>
                </div>
              </Reveal>
            </div>
          </section>

          {/* Pricing cards */}
          <section className="pb-20">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <StaggerGroup className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {PLAN_META.map((meta, idx) => {
                  const texts = planTexts[idx];
                  if (!texts) return null;
                  const isYearly = billing === 'yearly';
                  const displayMonthly = isYearly ? meta.yearlyMonthly : meta.monthly;
                  return (
                    <StaggerItem
                      as="article"
                      key={meta.tier}
                      className={cn(
                        'relative rounded-3xl p-8 transition-all duration-200 ease-out hover:-translate-y-1',
                        meta.popular
                          ? 'bg-foreground text-background border-2 border-foreground shadow-2xl md:scale-[1.03]'
                          : 'bg-white border border-neutral-200 shadow-input hover:shadow-elevated'
                      )}
                    >
                      {meta.popular && (
                        <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
                      )}
                      {meta.popular && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                          <span className="inline-flex px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium whitespace-nowrap">
                            {t('marketing.pricing.mostPopular')}
                          </span>
                        </div>
                      )}

                      <header className="mb-6">
                        <h2 className={cn('text-xl font-semibold mb-1', meta.popular ? 'text-background' : 'text-foreground')}>
                          {texts.name}
                        </h2>
                        <p className={cn('text-sm', meta.popular ? 'text-background/70' : 'text-muted-foreground')}>
                          {texts.description}
                        </p>
                      </header>

                      <div className="mb-6 min-h-[88px]">
                        <div className="flex items-baseline gap-2">
                          {isYearly && (
                            <span className={cn('text-lg line-through', meta.popular ? 'text-background/40' : 'text-muted-foreground/60')}>
                              €{meta.monthly.toFixed(2).replace('.', ',')}
                            </span>
                          )}
                          <span className={cn('text-4xl font-semibold transition-all', meta.popular ? 'text-background' : 'text-foreground')}>
                            €{displayMonthly.toFixed(2).replace('.', ',')}
                          </span>
                          <span className={cn('text-sm', meta.popular ? 'text-background/70' : 'text-muted-foreground')}>{t(`${P}.perMonthVat`)}</span>
                        </div>
                        {isYearly && (
                          <p className={cn('text-xs mt-2', meta.popular ? 'text-background/70' : 'text-muted-foreground')}>
                            {t(`${P}.billedYearly`, {
                              total: meta.yearlyTotal.toFixed(2).replace('.', ','),
                              savings: meta.yearlySavings.toFixed(2).replace('.', ','),
                            })}
                          </p>
                        )}
                        <p className={cn('text-xs mt-1.5 font-medium', meta.popular ? 'text-background/70' : 'text-success')}>
                          {meta.isFree ? t(`${P}.freeNote`) : t(`${P}.paidNote`)}
                        </p>
                      </div>

                      <ul className="space-y-3 mb-8">
                        {texts.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm">
                            <Check className={cn('w-4 h-4 flex-shrink-0 mt-0.5', meta.popular ? 'text-background/70' : 'text-success')} />
                            <span className={meta.popular ? 'text-background/90' : 'text-foreground'}>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className={cn(
                          'w-full h-12 rounded-xl text-sm font-medium',
                          meta.popular && 'bg-background text-foreground hover:bg-background/90'
                        )}
                        variant={meta.popular ? 'secondary' : 'default'}
                        onClick={() => handlePlanClick(meta.tier)}
                      >
                        {texts.cta}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </StaggerItem>
                  );
                })}
              </StaggerGroup>
            </div>
          </section>

          {/* Comparison table */}

          <section className="py-16 md:py-20">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <Reveal>
                <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-center text-foreground mb-3">
                  {t(`${P}.comparisonTitle`)}
                </h2>
                <p className="text-muted-foreground text-center mb-12">
                  {t(`${P}.comparisonSubtitle`)}
                </p>
              </Reveal>

              <div className="max-w-5xl mx-auto overflow-x-auto rounded-3xl border border-neutral-200 bg-white shadow-input">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="text-left p-4 md:p-5 font-medium text-muted-foreground w-1/3">{t(`${P}.featureCol`)}</th>
                      <th className="p-4 md:p-5 font-semibold text-foreground text-center">{planTexts[0]?.name}</th>
                      <th className="p-4 md:p-5 font-semibold text-foreground text-center">{planTexts[1]?.name}</th>
                      <th className="p-4 md:p-5 font-semibold text-center bg-[#2563eb] text-white relative">
                        {planTexts[2]?.name}
                        <span className="block text-[10px] font-normal text-white/80 mt-0.5">{t(`${P}.mostChosen`)}</span>
                      </th>
                      <th className="p-4 md:p-5 font-semibold text-foreground text-center">{planTexts[3]?.name}</th>
                    </tr>
                  </thead>
                  <StaggerGroup as="tbody" stagger={0.04}>
                    {visibleRows.map((row, i) => (
                      <StaggerItem as="tr" y={10} key={i} className="border-b border-border/30 last:border-0">
                        <td className="p-4 md:p-5 text-foreground">{rowNames[COMPARISON_DEF.indexOf(row)]}</td>
                        <td className="p-4 md:p-5 text-center">{renderCell(row.cells[0])}</td>
                        <td className="p-4 md:p-5 text-center">{renderCell(row.cells[1])}</td>
                        <td className="p-4 md:p-5 text-center bg-[#2563eb]/5">{renderCell(row.cells[2])}</td>
                        <td className="p-4 md:p-5 text-center">{renderCell(row.cells[3])}</td>
                      </StaggerItem>
                    ))}
                  </StaggerGroup>
                </table>
              </div>

              {/* Mobile/quick toggle: show all */}
              <div className="text-center mt-6 md:hidden">
                <Button variant="outline" onClick={() => setShowAllFeatures(v => !v)}>
                  {showAllFeatures ? t(`${P}.showLess`) : t(`${P}.showAll`)}
                </Button>
              </div>
              <div className="text-center mt-6 hidden md:block">
                {!showAllFeatures && (
                  <Button variant="ghost" onClick={() => setShowAllFeatures(true)}>
                    {t(`${P}.showAll`)}
                  </Button>
                )}
              </div>
            </div>
          </section>

          {/* Enterprise contact */}
          <section className="pb-24">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <Reveal className="mt-4 max-w-2xl mx-auto">
                <div className="rounded-xl border border-border/40 bg-muted/30 p-8 text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {t(`${P}.enterpriseTitle`)}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {t(`${P}.enterpriseDesc`)}
                  </p>
                  <Button variant="outline" onClick={() => window.location.href = 'mailto:info@getservio.co'}>
                    {t(`${P}.contactUs`)}
                  </Button>
                </div>
              </Reveal>
            </div>
          </section>

          <FAQSection />
          <LampCTA />
        </main>

        <LandingFooter />
      </div>
    </>
  );
}
