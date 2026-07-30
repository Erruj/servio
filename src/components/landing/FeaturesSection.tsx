import { Mail, BarChart3, FileText, Bot, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { featureVisuals } from '@/components/landing/FeatureVisuals';

const styling = [
  { icon: Mail, tint: 'from-primary/10 to-primary/0', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
  { icon: BarChart3, tint: 'from-accent/10 to-accent/0', iconBg: 'bg-accent/10', iconColor: 'text-accent' },
  { icon: FileText, tint: 'from-warning/10 to-warning/0', iconBg: 'bg-warning/10', iconColor: 'text-warning' },
  { icon: Bot, tint: 'from-success/10 to-success/0', iconBg: 'bg-success/10', iconColor: 'text-success' },
];

export function FeaturesSection() {
  const { t } = useTranslation();
  const items = t('marketing.features.items', { returnObjects: true }) as Array<{
    title: string;
    description: string;
    result: string;
  }>;

  return (
    <section
      id="features"
      className="relative py-24 md:py-32 bg-muted/30 overflow-hidden"
      aria-label="Servio features en voordelen"
    >
      <div className="absolute -top-32 -left-32 w-[400px] h-[400px] bg-primary/[0.05] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-20 w-[450px] h-[450px] bg-accent/[0.05] rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-6 relative">
        <div className="max-w-2xl mx-auto text-center mb-16 animate-fade-in-up">
          <span className="text-sm font-medium text-primary mb-4 block">
            {t('marketing.features.eyebrow')}
          </span>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-foreground mb-4">
            {t('marketing.features.title')}
          </h2>
          <p className="text-lg text-muted-foreground">{t('marketing.features.subtitle')}</p>
        </div>

        <div className="space-y-16 md:space-y-24 max-w-6xl mx-auto">
          {items.map((feature, index) => {
            const s = styling[index] || styling[0];
            const Icon = s.icon;
            const Visual = featureVisuals[index] || featureVisuals[0];
            const reverse = index % 2 === 1;

            return (
              <div
                key={index}
                className={`grid md:grid-cols-2 gap-8 md:gap-12 items-center animate-fade-in-up ${
                  reverse ? 'md:[&>*:first-child]:order-2' : ''
                }`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {/* Text */}
                <div>
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${s.iconBg} mb-5`}
                  >
                    <Icon className={`w-6 h-6 ${s.iconColor}`} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-semibold tracking-[-0.01em] text-foreground mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-5">
                    {feature.description}
                  </p>
                  <div
                    className={`inline-flex items-center gap-2 text-sm font-medium ${s.iconColor}`}
                  >
                    <ArrowRight className="w-4 h-4" />
                    {feature.result}
                  </div>
                </div>

                {/* Visual */}
                <div className="relative group">
                  <div
                    className={`absolute -inset-4 bg-gradient-to-br ${s.tint} rounded-2xl blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
                  />
                  <div className="relative transform transition-transform duration-500 group-hover:-translate-y-1">
                    <Visual />
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
