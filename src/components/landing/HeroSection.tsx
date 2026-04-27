import { Button } from '@/components/ui/button';
import { ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProductPreview } from '@/components/landing/ProductPreview';

export function HeroSection() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const prefix = isEn ? '/en' : '';

  const checks = [
    t('marketing.hero.checkAutoEmail'),
    t('marketing.hero.checkInvoice'),
    t('marketing.hero.checkDashboard'),
  ];

  const trust = [
    t('marketing.hero.trustNoCard'),
    t('marketing.hero.trustQuickSetup'),
    t('marketing.hero.trustCancel'),
  ];

  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden" aria-label="Servio AI bedrijfsassistent introductie">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/40 via-background to-background pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/[0.06] rounded-full blur-3xl pointer-events-none animate-pulse-subtle" />
      <div className="absolute top-40 -left-20 w-[500px] h-[500px] bg-accent/[0.05] rounded-full blur-3xl pointer-events-none animate-float" />
      <div className="absolute top-20 -right-20 w-[450px] h-[450px] bg-primary/[0.04] rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background text-sm text-muted-foreground mb-8 animate-fade-in"
            style={{ animationDelay: '0ms' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            {t('marketing.hero.badge')}
          </div>

          <h1
            className="text-[2.75rem] md:text-6xl lg:text-[4.5rem] font-semibold tracking-[-0.02em] text-foreground mb-6 leading-[1.08] animate-fade-in"
            style={{ animationDelay: '50ms' }}
          >
            {t('marketing.hero.title1')}
            <br />
            <span className="text-primary">{t('marketing.hero.title2')}</span>
          </h1>

          <p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed animate-fade-in"
            style={{ animationDelay: '100ms' }}
          >
            {t('marketing.hero.subtitle')}
          </p>

          <div
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-10 text-sm animate-fade-in"
            style={{ animationDelay: '125ms' }}
          >
            {checks.map((item, i) => (
              <span key={i} className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-success" />
                {item}
              </span>
            ))}
          </div>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in"
            style={{ animationDelay: '150ms' }}
          >
            <Button
              size="lg"
              className="h-12 px-8 text-[15px] font-medium rounded-lg transition-smooth glow-primary hover:glow"
              onClick={() => navigate('/signup')}
            >
              {t('marketing.hero.ctaPrimary')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-8 text-[15px] font-medium rounded-lg"
              onClick={() => navigate(`${prefix}/features`)}
            >
              <Play className="mr-2 h-4 w-4" />
              {t('marketing.hero.ctaSecondary')}
            </Button>
          </div>

          <div
            className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-muted-foreground animate-fade-in"
            style={{ animationDelay: '200ms' }}
          >
            {trust.map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div
          className="mt-20 md:mt-28 relative animate-fade-in"
          style={{ animationDelay: '250ms' }}
        >
          <div className="absolute -bottom-1 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />

          <div className="relative mx-auto max-w-5xl rounded-xl border border-border/60 bg-card shadow-xl-soft overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/30">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-border" />
                <div className="w-2.5 h-2.5 rounded-full bg-border" />
                <div className="w-2.5 h-2.5 rounded-full bg-border" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-8 py-1 rounded-md bg-muted text-xs text-muted-foreground font-medium">
                  app.getservio.co
                </div>
              </div>
              <div className="w-16" />
            </div>

            <div className="aspect-[16/10] bg-muted/20 relative overflow-hidden">
              <ProductPreview />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/[0.04] via-transparent to-accent/[0.04] pointer-events-none" />
              <div className="absolute inset-0 ring-1 ring-inset ring-border/40 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
