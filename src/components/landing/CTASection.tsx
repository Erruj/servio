import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function CTASection() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const prefix = i18n.language?.startsWith('en') ? '/en' : '';

  const trust = [
    t('marketing.cta.trust1'),
    t('marketing.cta.trust2'),
    t('marketing.cta.trust3'),
  ];

  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border border-primary/20 p-10 md:p-16 text-center overflow-hidden animate-scale-in">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-accent/15 rounded-full blur-3xl pointer-events-none animate-float" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/[0.06] rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.02em] text-foreground mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                {t('marketing.cta.title')}
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                {t('marketing.cta.subtitle')}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-10 text-sm animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                {trust.map((item, i) => (
                  <span key={i} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    {item}
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
                <Button
                  size="lg"
                  className="h-14 px-10 text-base font-medium rounded-xl transition-all duration-300 glow-primary hover:scale-[1.02] hover:shadow-xl"
                  onClick={() => navigate('/signup')}
                >
                  {t('marketing.cta.button')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              <p className="mt-6 text-sm text-muted-foreground animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                {t('marketing.cta.orSee')}{' '}
                <button onClick={() => navigate(`${prefix}/features`)} className="text-primary hover:underline font-medium transition-colors duration-200">
                  {t('marketing.cta.orSeeLink')}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
