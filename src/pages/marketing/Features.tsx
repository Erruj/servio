import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { CTASection } from '@/components/landing/CTASection';
import { Helmet } from 'react-helmet-async';
import { Mail, BarChart3, FileText, Bot, Sparkles, Shield } from 'lucide-react';

const features = [
  {
    id: 'klantenservice',
    icon: Mail,
    title: 'Slimme Klantenservice',
    description: 'Laat AI je e-mails beantwoorden met intelligente suggesties die passen bij jouw communicatiestijl.',
    details: [
      'Automatische reply-suggesties op basis van context',
      'Sentiment-analyse om prioriteiten te bepalen',
      'Slimme categorisering van binnenkomende berichten',
    ],
  },
  {
    id: 'facturen',
    icon: FileText,
    title: 'Factuurverwerking',
    description: 'Upload facturen en laat AI automatisch alle belangrijke gegevens extraheren en categoriseren.',
    details: [
      'Automatische herkenning van bedragen en BTW',
      'Leverancier- en datumdetectie',
      'Slimme categorisering voor je boekhouding',
    ],
  },
  {
    id: 'financieel',
    icon: BarChart3,
    title: 'Financieel Overzicht',
    description: 'Real-time inzicht in je inkomsten, uitgaven en winstmarges met duidelijke visualisaties.',
    details: [
      'Dashboard met live financiële metrics',
      'Trend-analyses en voorspellingen',
      'Exporteer naar Excel of PDF',
    ],
  },
  {
    id: 'ai-assistent',
    icon: Bot,
    title: 'AI Boekhoudassistent',
    description: 'Stel vragen over je financiën in natuurlijke taal en krijg direct antwoord.',
    details: [
      'Vraag naar omzet, winst of uitgaven',
      'Bereken BTW-reserveringen automatisch',
      'Identificeer je grootste kostenposten',
    ],
  },
];

export default function Features() {
  return (
    <>
      <Helmet>
        <title>Features - Servio</title>
        <meta name="description" content="Ontdek alle krachtige features van Servio: slimme klantenservice, factuurverwerking, financieel overzicht en AI boekhoudassistent." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingHeader />
        
        <main>
          {/* Hero */}
          <section className="pt-32 pb-20 md:pt-44 md:pb-28">
            <div className="container mx-auto px-6">
              <div className="max-w-3xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.02em] text-foreground mb-6 leading-tight">
                  Alles wat je nodig hebt,
                  <br />
                  <span className="text-primary">op één plek.</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
                  Krachtige tools die samenwerken om je bedrijf te stroomlijnen en je tijd terug te geven.
                </p>
              </div>
            </div>
          </section>

          {/* Feature sections */}
          {features.map((feature, index) => (
            <section 
              key={feature.id}
              id={feature.id}
              className={`py-20 md:py-28 ${index % 2 === 1 ? 'bg-muted/30' : ''}`}
            >
              <div className="container mx-auto px-6">
                <div className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}>
                  {/* Content */}
                  <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                      <feature.icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-foreground mb-4">
                      {feature.title}
                    </h2>
                    <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                      {feature.description}
                    </p>
                    <ul className="space-y-4">
                      {feature.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Sparkles className="w-3 h-3 text-primary" />
                          </div>
                          <span className="text-foreground">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Mockup */}
                  <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                    <div className="rounded-2xl border border-border/60 bg-card shadow-xl-soft overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/30">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-border" />
                          <div className="w-2.5 h-2.5 rounded-full bg-border" />
                          <div className="w-2.5 h-2.5 rounded-full bg-border" />
                        </div>
                      </div>
                      <div className="aspect-[4/3] bg-muted/20 p-6">
                        {/* Abstract mockup content */}
                        <div className="h-full rounded-lg bg-card border border-border/40 p-5">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-primary/10" />
                            <div className="space-y-1.5 flex-1">
                              <div className="h-3 w-1/3 bg-muted rounded" />
                              <div className="h-2 w-1/2 bg-muted/60 rounded" />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="h-10 bg-muted/40 rounded-lg" />
                            <div className="h-10 bg-muted/40 rounded-lg" />
                            <div className="h-10 bg-muted/40 rounded-lg" />
                          </div>
                          <div className="mt-6 flex gap-3">
                            <div className="h-9 flex-1 bg-primary/20 rounded-lg" />
                            <div className="h-9 w-24 bg-muted/40 rounded-lg" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ))}

          {/* Security section */}
          <section className="py-20 md:py-28 bg-muted/30">
            <div className="container mx-auto px-6">
              <div className="max-w-3xl mx-auto text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-6 h-6 text-primary" strokeWidth={1.5} />
                </div>
                <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-foreground mb-4">
                  Veilig & betrouwbaar
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
                  Je data is veilig bij ons. We gebruiken enterprise-grade encryptie en voldoen aan alle AVG/GDPR-vereisten. 
                  Je gegevens worden opgeslagen in beveiligde datacenters binnen de EU.
                </p>
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
