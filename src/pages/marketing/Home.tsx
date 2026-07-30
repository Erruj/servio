import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { ProductSection } from '@/components/landing/ProductSection';
import { BenefitsSection } from '@/components/landing/BenefitsSection';
import { CTASection } from '@/components/landing/CTASection';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { SeoHead } from '@/components/SeoHead';
import { useTranslation } from 'react-i18next';

export default function MarketingHome() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

  const title = isEn
    ? 'Servio – AI Business Assistant for Freelancers & SMBs'
    : 'Servio – AI Bedrijfsassistent voor ZZP & MKB';
  const description = isEn
    ? 'Servio automates your emails, processes invoices and gives real-time financial insight. Try free for 14 days.'
    : 'Servio automatiseert je e-mails, verwerkt facturen en geeft realtime financieel inzicht. Probeer 14 dagen gratis.';
  const keywords = isEn
    ? 'AI customer service, automate admin, bookkeeping freelancers, business assistant software, invoice processing, financial dashboard, SMB software'
    : 'AI klantenservice, administratie automatiseren, boekhouding voor ZZP, bedrijfsassistent software, facturen verwerken, financieel dashboard, MKB software';

  const faqItems = (t('marketing.faq.items', { returnObjects: true }) as Array<{ q: string; a: string }>) || [];
  const faqJsonLd = faqItems.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }
    : null;

  return (
    <>
      <SeoHead path="/" title={title} description={description} keywords={keywords}>
        {faqJsonLd && (
          <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
        )}
      </SeoHead>

      <div className="min-h-screen bg-background">
        <LandingHeader />

        <main>
          <HeroSection />
          <FeaturesSection />
          <HowItWorksSection />
          <ProductSection />
          <BenefitsSection />
          <CTASection />
        </main>

        <LandingFooter />
      </div>
    </>
  );
}
