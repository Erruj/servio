import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function FAQSection() {
  const { t, i18n } = useTranslation();
  const prefix = i18n.language?.startsWith('en') ? '/en' : '';
  const items = t('marketing.faq.items', { returnObjects: true }) as Array<{ q: string; a: string }>;

  return (
    <section className="py-24 md:py-32 bg-muted/30" aria-label="Veelgestelde vragen over Servio">
      <div className="container mx-auto px-6">
        <div className="max-w-xl mx-auto text-center mb-16 animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-foreground mb-4">
            {t('marketing.faq.title')}
          </h2>
          <p className="text-muted-foreground">
            {t('marketing.faq.subtitle')}{' '}
            <Link to={`${prefix}/contact`} className="text-primary hover:underline">{t('marketing.faq.contactLink')}</Link>{' '}
            {t('marketing.faq.subtitleSuffix')}
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="space-y-2">
            {items.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border/40 rounded-xl px-5 data-[state=open]:border-border transition-all duration-200 animate-fade-in-up hover:border-border"
                style={{ animationDelay: `${(index + 1) * 50}ms` }}
              >
                <AccordionTrigger className="text-left text-[15px] font-medium hover:no-underline py-4 text-foreground">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
