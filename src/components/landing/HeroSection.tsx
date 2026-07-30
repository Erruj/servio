import { Button } from '@/components/ui/button';
import { ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProductPreview } from '@/components/landing/ProductPreview';
import { LoadIn } from '@/components/landing/motion';
import { motion, useReducedMotion } from 'framer-motion';

export function HeroSection() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const prefix = isEn ? '/en' : '';
  const reduced = useReducedMotion();

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
          <LoadIn index={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background text-sm text-muted-foreground mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            {t('marketing.hero.badge')}
          </LoadIn>

          <LoadIn
            as="h1"
            index={1}
            className="text-[2.75rem] md:text-6xl lg:text-[4.5rem] font-semibold tracking-[-0.02em] text-foreground mb-6 leading-[1.08]"
          >
            {t('marketing.hero.title1')}
            <br />
            <span className="text-primary">{t('marketing.hero.title2')}</span>
          </LoadIn>

          <LoadIn
            as="p"
            index={2}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            {t('marketing.hero.subtitle')}
          </LoadIn>

          <LoadIn index={3} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-sm font-medium text-primary mb-8">
            <CheckCircle2 className="w-4 h-4" />
            {t('marketing.hero.uniqueClaim')}
          </LoadIn>

          <LoadIn index={4} className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-10 text-sm">
            {checks.map((item, i) => (
              <span key={i} className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-success" />
                {item}
              </span>
            ))}
          </LoadIn>

          <LoadIn index={5} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="h-12 px-8 text-[15px] font-medium rounded-lg glow-primary hover:glow transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-lg"
              onClick={() => navigate('/signup')}
            >
              {t('marketing.hero.ctaPrimary')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-8 text-[15px] font-medium rounded-lg transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-md"
              onClick={() => navigate(`${prefix}/features`)}
            >
              <Play className="mr-2 h-4 w-4" />
              {t('marketing.hero.ctaSecondary')}
            </Button>
          </LoadIn>

          <LoadIn index={6} className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-muted-foreground">
            {trust.map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                {item}
              </span>
            ))}
          </LoadIn>
        </div>

        <LoadIn index={7} y={24} className="mt-20 md:mt-28 relative">
          <div className="absolute -bottom-1 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />

          {/* Subtiele, langzame gloed achter de mockup — puur decoratief */}
          {!reduced && (
            <motion.div
              aria-hidden="true"
              className="absolute -inset-16 pointer-events-none"
              style={{
                background:
                  'radial-gradient(closest-side, hsl(var(--primary) / 0.10), transparent 70%)',
              }}
              animate={{ opacity: [0.5, 0.9, 0.5], scale: [1, 1.06, 1] }}
              transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

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
        </LoadIn>
      </div>
    </section>
  );
}
