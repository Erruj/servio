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
        <title>Servio – AI Bedrijfsassistent voor ZZP & MKB | Automatiseer je Inbox en Administratie</title>
        <meta name="description" content="Servio is de slimme AI-assistent voor ondernemers. Automatiseer tot 80% van je e-mails, verwerk facturen automatisch en krijg realtime inzicht in je financiën. Probeer 14 dagen gratis." />
        <meta name="keywords" content="AI klantenservice, administratie automatiseren, boekhouding voor ZZP, bedrijfsassistent software, facturen verwerken, financieel dashboard, MKB software" />
        <link rel="canonical" href="https://getservio.co" />
        
        <meta property="og:title" content="Servio – AI Bedrijfsassistent voor ZZP & MKB" />
        <meta property="og:description" content="Automatiseer je inbox en administratie met AI. Probeer 14 dagen gratis." />
        <meta property="og:image" content="https://getservio.co/og-image.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://getservio.co" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Servio – AI Bedrijfsassistent voor ZZP & MKB" />
        <meta name="twitter:description" content="Automatiseer je inbox en administratie met AI. Probeer 14 dagen gratis." />
        <meta name="twitter:image" content="https://getservio.co/og-image.png" />

        {/* Structured Data - FAQ */}
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Hoe werkt de AI?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Servio gebruikt geavanceerde AI-modellen om je e-mails te analyseren en intelligente antwoordsuggesties te geven. De AI leert van je bedrijfscontext en past zich aan je communicatiestijl aan."
                }
              },
              {
                "@type": "Question",
                "name": "Is mijn data veilig?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Absoluut. We gebruiken enterprise-grade encryptie voor alle data. Je gegevens worden opgeslagen in beveiligde datacenters binnen de EU en we voldoen aan alle AVG/GDPR-vereisten."
                }
              },
              {
                "@type": "Question",
                "name": "Heb ik een gratis proefperiode?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Ja, je krijgt 14 dagen gratis toegang tot alle functies zonder creditcard. Na de proefperiode kun je kiezen voor een betaald abonnement of gewoon stoppen zonder verplichtingen."
                }
              }
            ]
          }
        `}</script>
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
