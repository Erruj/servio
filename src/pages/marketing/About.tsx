import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { CTASection } from '@/components/landing/CTASection';
import { SeoHead } from '@/components/SeoHead';
import { Heart, Lightbulb, Users, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const icons = [Target, Heart, Lightbulb, Users];

export default function About() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

  const stats = t('marketing.about.stats', { returnObjects: true }) as Array<{ value: string; label: string }>;
  const values = t('marketing.about.values', { returnObjects: true }) as Array<{ title: string; description: string }>;

  const title = isEn
    ? 'About Servio – The AI Business Assistant for Entrepreneurs'
    : 'Over Servio – De AI Bedrijfsassistent voor Nederlandse Ondernemers';
  const description = isEn
    ? 'Servio is built by entrepreneurs, for entrepreneurs. Our mission: help freelancers and SMBs with AI-powered admin and customer service.'
    : "Servio is gebouwd door ondernemers, voor ondernemers. Onze missie: ZZP'ers en MKB'ers helpen met AI-gestuurde administratie en klantenservice.";

  return (
    <>
      <SeoHead path="/about" title={title} description={description} />

      <div className="min-h-screen bg-background">
        <LandingHeader />

        <main>
          <section className="pt-32 pb-20 md:pt-44 md:pb-28">
            <div className="container mx-auto px-6">
              <div className="max-w-3xl mx-auto text-center">
                <span className="text-sm font-medium text-primary mb-4 block">{t('marketing.about.eyebrow')}</span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.02em] text-foreground mb-6 leading-tight">
                  {t('marketing.about.h1Top')}
                  <br />
                  <span className="text-primary">{t('marketing.about.h1Bottom')}</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
                  {t('marketing.about.subtitle')}
                </p>
              </div>
            </div>
          </section>

          <section className="py-20 md:py-28 bg-muted/30">
            <div className="container mx-auto px-6">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-foreground mb-8 text-center">
                  {t('marketing.about.missionTitle')}
                </h2>
                <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                  <p>{t('marketing.about.missionP1')}</p>
                  <p dangerouslySetInnerHTML={{ __html: t('marketing.about.missionP2') }} />
                  <p>{t('marketing.about.missionP3')}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="py-20 md:py-28">
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
                {stats.map((stat, i) => (
                  <div key={i}>
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-20 md:py-28 bg-muted/30">
            <div className="container mx-auto px-6">
              <div className="max-w-xl mx-auto text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-foreground mb-4">
                  {t('marketing.about.valuesTitle')}
                </h2>
                <p className="text-muted-foreground">{t('marketing.about.valuesSubtitle')}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {values.map((value, index) => {
                  const Icon = icons[index] || Target;
                  return (
                    <article key={index} className="p-8 rounded-xl bg-card border border-border/40">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                        <Icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">{value.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="py-20 md:py-28">
            <div className="container mx-auto px-6">
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-foreground mb-6">
                  {t('marketing.about.teamTitle')}
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                  {t('marketing.about.teamP1')}
                </p>
                <p className="text-sm text-muted-foreground">{t('marketing.about.madeIn')}</p>
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
