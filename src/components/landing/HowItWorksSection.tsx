import { Link2, Sparkles, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const icons = [Link2, Sparkles, TrendingUp];

export function HowItWorksSection() {
  const { t } = useTranslation();
  const steps = t('marketing.howItWorks.steps', { returnObjects: true }) as Array<{ title: string; description: string }>;

  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center mb-16 animate-fade-in-up">
          <span className="text-sm font-medium text-primary mb-4 block">{t('marketing.howItWorks.eyebrow')}</span>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-foreground mb-4">
            {t('marketing.howItWorks.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('marketing.howItWorks.subtitle')}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 md:gap-4">
            {steps.map((step, index) => {
              const Icon = icons[index] || Link2;
              return (
                <div
                  key={index}
                  className="relative animate-fade-in-up"
                  style={{ animationDelay: `${(index + 1) * 150}ms` }}
                >
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-border to-transparent z-0" />
                  )}

                  <div className="relative z-10 text-center md:text-left group">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-muted/50 border border-border/40 mb-6 mx-auto md:mx-0 group-hover:border-primary/30 group-hover:bg-primary/5 transition-all duration-300">
                      <Icon className="w-10 h-10 text-primary group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
                    </div>

                    <div className="text-xs font-bold text-primary/60 tracking-widest mb-2">
                      {t('marketing.howItWorks.step')} {String(index + 1).padStart(2, '0')}
                    </div>

                    <h3 className="text-lg font-semibold text-foreground mb-3">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
