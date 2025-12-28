import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { ProductSection } from '@/components/landing/ProductSection';
import { BenefitsSection } from '@/components/landing/BenefitsSection';
import { CTASection } from '@/components/landing/CTASection';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Helmet } from 'react-helmet-async';

export default function MarketingHome() {
  return (
    <>
      <Helmet>
        <title>Servio - De slimme bedrijfsassistent voor ondernemers</title>
        <meta name="description" content="Automatiseer je klantenservice, beheer je facturen en krijg realtime financiële inzichten — allemaal op één plek. Start vandaag nog gratis." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingHeader />
        
        <main>
          <HeroSection />
          <FeaturesSection />
          <ProductSection />
          <BenefitsSection />
          <CTASection />
        </main>
        
        <LandingFooter />
      </div>
    </>
  );
}
