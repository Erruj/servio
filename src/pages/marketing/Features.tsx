import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { CTASection } from '@/components/landing/CTASection';
import { SeoHead } from '@/components/SeoHead';
import { Mail, BarChart3, FileText, Bot, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const icons = [Mail, FileText, BarChart3, Bot];

export default function Features() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

  const items = t('marketing.featuresPage.items', { returnObjects: true }) as Array<{
    id: string; title: string; subtitle: string; description: string; details: string[]; result: string;
  }>;
  const security = t('marketing.featuresPage.security', { returnObjects: true }) as { title: string; description: string; points: string[] };

  const title = isEn
    ? 'Features – AI Inbox, Invoice Processing & Financial Dashboard | Servio'
    : 'Features – AI Inbox, Factuurverwerking & Financieel Dashboard | Servio';
  const description = isEn
    ? 'Discover all Servio features: AI inbox that handles 80% of your emails, automatic invoice processing, and a real-time financial dashboard for freelancers & SMBs.'
    : 'Ontdek alle features van Servio: AI-gestuurde inbox die 80% van je mails beantwoordt, automatische factuurverwerking, en realtime financieel dashboard voor ZZP & MKB.';

  return (
    <>
      <SeoHead path="/features" title={title} description={description} />

      <div className="min-h-screen bg-background">
        <LandingHeader />

        <main>
          <section className="pt-32 pb-20 md:pt-44 md:pb-28">
            <div className="container mx-auto px-6">
              <div className="max-w-3xl mx-auto text-center">
                <span className="text-sm font-medium text-primary mb-4 block">{t('marketing.featuresPage.eyebrow')}</span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.02em] text-foreground mb-6 leading-tight">
                  {t('marketing.featuresPage.h1Top')}
                  <br />
                  <span className="text-primary">{t('marketing.featuresPage.h1Bottom')}</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
                  {t('marketing.featuresPage.subtitle')}
                </p>
              </div>
            </div>
          </section>

          {items.map((feature, index) => {
            const Icon = icons[index] || Mail;
            return (
              <section
                key={feature.id}
                id={feature.id}
                className={`py-20 md:py-28 ${index % 2 === 1 ? 'bg-muted/30' : ''}`}
              >
                <div className="container mx-auto px-6">
                  <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto">
                    <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                        <Icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                      </div>
                      <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-foreground mb-2">{feature.title}</h2>
                      <p className="text-lg text-primary font-medium mb-4">{feature.subtitle}</p>
                      <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{feature.description}</p>
                      <ul className="space-y-4 mb-8">
                        {feature.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                            <span className="text-foreground">{detail}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary font-medium">
                        <ArrowRight className="w-4 h-4" />
                        {feature.result}
                      </div>
                    </div>

                    <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                      <div className="rounded-2xl border border-border/60 bg-card shadow-xl-soft overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/30">
                          <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-border" />
                            <div className="w-2.5 h-2.5 rounded-full bg-border" />
                            <div className="w-2.5 h-2.5 rounded-full bg-border" />
                          </div>
                        </div>
                        <div className="aspect-[4/3] bg-muted/20 p-6">
                          <div className="h-full rounded-lg bg-card border border-border/40 p-5">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                              </div>
                              <div className="space-y-1.5 flex-1">
                                <div className="h-3 w-1/3 bg-muted rounded" />
                                <div className="h-2 w-1/2 bg-muted/60 rounded" />
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="h-10 bg-muted/40 rounded-lg" />
                              <div className="h-10 bg-muted/40 rounded-lg" />
                              <div className="h-10 bg-muted/40 rounded-lg" />
                            </div>
                            <div className="mt-6 flex gap-3">
                              <div className="h-9 flex-1 bg-primary/20 rounded-lg" />
                              <div className="h-9 w-24 bg-muted/40 rounded-lg" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}

          <section className="py-20 md:py-28 bg-muted/30">
            <div className="container mx-auto px-6">
              <div className="max-w-3xl mx-auto text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-6 h-6 text-primary" strokeWidth={1.5} />
                </div>
                <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-foreground mb-4">
                  {security.title}
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto mb-8">
                  {security.description}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                  {security.points.map((item, i) => (
                    <span key={i} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <CTASection />
        </main>

        <LandingFooter />
      </div>
    </>
  );
}
