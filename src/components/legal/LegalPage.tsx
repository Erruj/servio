import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { SeoHead } from '@/components/SeoHead';
import { useTranslation } from 'react-i18next';

interface Section {
  h: string;
  p?: string;
  list?: string[];
}

interface LegalPageProps {
  /** i18n key under marketing.legal — 'privacy' | 'terms' | 'cookies' */
  docKey: 'privacy' | 'terms' | 'cookies';
  path: '/privacy' | '/terms' | '/cookies';
  seoTitleNl: string;
  seoTitleEn: string;
  seoDescriptionNl: string;
  seoDescriptionEn: string;
}

export function LegalPage({ docKey, path, seoTitleNl, seoTitleEn, seoDescriptionNl, seoDescriptionEn }: LegalPageProps) {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

  const title = (t(`marketing.legal.${docKey}.title`) as string) || '';
  const sections = t(`marketing.legal.${docKey}.sections`, { returnObjects: true }) as Section[];
  const lastUpdated = t('marketing.legal.lastUpdated');
  const dateLocale = isEn ? 'en-GB' : 'nl-NL';

  return (
    <>
      <SeoHead
        path={path}
        title={isEn ? seoTitleEn : seoTitleNl}
        description={isEn ? seoDescriptionEn : seoDescriptionNl}
      />

      <div className="min-h-screen bg-background">
        <LandingHeader />

        <main className="pt-32 pb-20">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-8">{title}</h1>

              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-lg text-muted-foreground mb-8">
                  {lastUpdated} {new Date().toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>

                {sections.map((section, i) => (
                  <section key={i} className="mb-8">
                    <h2 className="text-2xl font-semibold text-foreground mb-4">{section.h}</h2>
                    {section.p && (
                      <p
                        className="text-muted-foreground leading-relaxed mb-4"
                        dangerouslySetInnerHTML={{
                          __html: section.p.replace(
                            /info@getservio\.co/g,
                            '<a href="mailto:info@getservio.co" class="text-primary hover:underline">info@getservio.co</a>'
                          ),
                        }}
                      />
                    )}
                    {section.list && (
                      <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        {section.list.map((item, j) => (
                          <li key={j}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </div>
            </div>
          </div>
        </main>

        <LandingFooter />
      </div>
    </>
  );
}
