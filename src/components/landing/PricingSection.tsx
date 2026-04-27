import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/components/AuthProvider';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';

const tiers = ['starter', 'pro', 'business'] as const;

export function PricingSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { createCheckoutSession } = useSubscription();

  const plans = (t('marketing.pricing.plans', { returnObjects: true }) as Array<{ name: string; price: string; description: string; features: string[] }>)
    .map((p, i) => ({ ...p, tier: tiers[i], popular: i === 1 }));

  const handlePlanClick = async (tier: string) => {
    if (!user) {
      navigate('/signup');
      return;
    }
    toast.info('Checkout...');
    await createCheckoutSession(tier);
  };

  return (
    <section className="py-24 md:py-32" id="pricing">
      <div className="container mx-auto px-6">
        <div className="max-w-xl mx-auto text-center mb-16 animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-foreground mb-4">
            {t('marketing.pricing.sectionTitle')}
          </h2>
          <p className="text-muted-foreground">
            {t('marketing.pricing.sectionSubtitle')}
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
                    {t('marketing.pricing.mostPopular')}
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
                <span className={`text-sm ${plan.popular ? 'text-background/70' : 'text-muted-foreground'}`}>{t('marketing.pricing.perMonth')}</span>
              </div>

              <div className={`mb-5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                plan.popular
                  ? 'bg-background/20 text-background'
                  : 'bg-success/10 text-success'
              }`}>
                <Check className="w-3 h-3" />
                {t('marketing.pricing.freeTrialBadge')}
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
                onClick={() => handlePlanClick(plan.tier)}
              >
                {t('marketing.pricing.startFree')}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
