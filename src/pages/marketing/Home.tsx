import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { ProductSection } from '@/components/landing/ProductSection';
import { BenefitsSection } from '@/components/landing/BenefitsSection';
import { CTASection } from '@/components/landing/CTASection';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Helmet } from 'react-helmet-async';

export default function MarketingHome() {
  return (
    <>
      <Helmet>
        <title>Servio - AI Bedrijfsassistent voor ZZP & MKB | Automatiseer Administratie</title>
        <meta 
          name="description" 
          content="Bespaar 8+ uur per week met Servio. AI-gestuurde klantenservice, automatische factuurverwerking en realtime financieel inzicht. 14 dagen gratis proberen." 
        />
        <meta 
          name="keywords" 
          content="AI klantenservice, administratie automatiseren, boekhouding voor ZZP, bedrijfsassistent software, facturen verwerken, financieel dashboard, MKB software" 
        />
        <link rel="canonical" href="https://servio.nl" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Servio - AI Bedrijfsassistent voor ZZP & MKB" />
        <meta property="og:description" content="Automatiseer je administratie en bespaar 8+ uur per week. 14 dagen gratis." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://servio.nl" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Servio - AI Bedrijfsassistent voor ZZP & MKB" />
        <meta name="twitter:description" content="Automatiseer je administratie en bespaar 8+ uur per week." />
      </Helmet>
      
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
