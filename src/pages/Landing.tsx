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
        <title>Servio - De slimme bedrijfsassistent voor ondernemers</title>
        <meta name="description" content="Automatiseer je klantenservice, beheer je facturen en krijg realtime financiële inzichten — allemaal op één plek. Start vandaag nog gratis." />
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
