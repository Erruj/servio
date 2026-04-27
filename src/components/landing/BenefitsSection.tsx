import { Clock, FileX, PieChart, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const icons = [Clock, FileX, PieChart, Shield];

export function BenefitsSection() {
  const { t } = useTranslation();
  const items = t('marketing.benefits.items', { returnObjects: true }) as Array<{ title: string; description: string; stat: string; statLabel: string }>;

  return (
    <section className="relative py-24 md:py-32 bg-muted/30 overflow-hidden" aria-label="Voordelen van Servio voor ondernemers">
      <div className="absolute -top-20 right-1/4 w-[500px] h-[500px] bg-primary/[0.05] rounded-full blur-3xl pointer-events-none animate-float" />
      <div className="absolute -bottom-20 left-1/4 w-[400px] h-[400px] bg-accent/[0.05] rounded-full blur-3xl pointer-events-none" />
      <div className="container mx-auto px-6 relative">
        <div className="max-w-2xl mx-auto text-center mb-16 animate-fade-in-up">
          <span className="text-sm font-medium text-primary mb-4 block">{t('marketing.benefits.eyebrow')}</span>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-foreground mb-4">
            {t('marketing.benefits.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('marketing.benefits.subtitle')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {items.map((benefit, index) => {
            const Icon = icons[index] || Clock;
            return (
              <div
                key={index}
                className="group p-8 rounded-xl bg-card border border-border/40 hover:border-border hover:shadow-elevated transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300">
                    <Icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">{benefit.description}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-primary">{benefit.stat}</span>
                      <span className="text-sm text-muted-foreground">{benefit.statLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
