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
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

  const title = isEn
    ? 'Servio – AI Business Assistant for Freelancers & SMBs | Automate Inbox & Admin'
    : 'Servio – AI Bedrijfsassistent voor ZZP & MKB | Automatiseer je Inbox en Administratie';
  const description = isEn
    ? 'Servio is the smart AI assistant for entrepreneurs. Automate up to 80% of your emails, process invoices automatically and get real-time insight into your finances. Try free for 14 days.'
    : 'Servio is de slimme AI-assistent voor ondernemers. Automatiseer tot 80% van je e-mails, verwerk facturen automatisch en krijg realtime inzicht in je financiën. Probeer 14 dagen gratis.';
  const keywords = isEn
    ? 'AI customer service, automate admin, bookkeeping freelancers, business assistant software, invoice processing, financial dashboard, SMB software'
    : 'AI klantenservice, administratie automatiseren, boekhouding voor ZZP, bedrijfsassistent software, facturen verwerken, financieel dashboard, MKB software';

  return (
    <>
      <SeoHead path="/" title={title} description={description} keywords={keywords} />

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
