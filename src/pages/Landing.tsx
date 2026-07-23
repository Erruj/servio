import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { ProductSection } from '@/components/landing/ProductSection';
import { BenefitsSection } from '@/components/landing/BenefitsSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Helmet } from 'react-helmet-async';

export default function Landing() {
  return (
    <>
      <Helmet>
        <title>Servio – AI Bedrijfsassistent voor ZZP & MKB</title>
        <meta name="description" content="Automatiseer tot 80% van je e-mails, verwerk facturen automatisch en krijg realtime inzicht in je financiën. 14 dagen gratis." />
        <link rel="canonical" href="https://getservio.co" />
        <meta property="og:title" content="Servio – AI Bedrijfsassistent voor ZZP & MKB" />
        <meta property="og:description" content="Automatiseer je inbox en administratie met AI. Probeer 14 dagen gratis." />
        <meta property="og:image" content="https://getservio.co/og-image.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://getservio.co" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://getservio.co/og-image.png" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingHeader />
        
        <main>
          <HeroSection />
          
          <div id="features">
            <FeaturesSection />
          </div>
          
          <ProductSection />
          
          <BenefitsSection />
          
          <PricingSection />
          
          <TestimonialsSection />
          
          <div id="faq">
            <FAQSection />
          </div>
        </main>
        
        <LandingFooter />
      </div>
    </>
  );
}
