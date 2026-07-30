import { Mail, BarChart3, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const icons = [Mail, BarChart3, FileText];

export function ProductSection() {
  const { t } = useTranslation();
  const items = t('marketing.product.items', { returnObjects: true }) as Array<{ title: string; description: string; metrics: string[] }>;

  return (
    <section className="relative py-24 md:py-32 overflow-hidden" aria-label="Servio producten overzicht">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-0 w-[300px] h-[300px] bg-accent/[0.05] rounded-full blur-3xl pointer-events-none" />
      <div className="container mx-auto px-6 relative">
        <div className="max-w-2xl mx-auto text-center mb-16 animate-fade-in-up">
          <span className="text-sm font-medium text-primary mb-4 block">{t('marketing.product.eyebrow')}</span>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-foreground mb-4">
            {t('marketing.product.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('marketing.product.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {items.map((product, index) => {
            const Icon = icons[index] || Mail;
            return (
              <div
                key={index}
                className="group rounded-xl border border-border/40 overflow-hidden bg-card hover:border-border hover:shadow-elevated transition-all duration-500 animate-fade-in-up"
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="aspect-[4/3] bg-muted/30 p-5 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-50">
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)',
                      backgroundSize: '24px 24px'
                    }} />
                  </div>

                  <div className="relative h-full rounded-lg bg-card border border-border/60 p-4 shadow-card transform group-hover:translate-y-[-4px] group-hover:shadow-elevated transition-all duration-500 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-8 h-8 text-primary" strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {product.metrics.map((metric, i) => (
                        <span key={i} className="px-2 py-1 rounded-full bg-muted text-xs text-muted-foreground">
                          {metric}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{product.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{product.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
