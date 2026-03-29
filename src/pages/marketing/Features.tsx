import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { CTASection } from '@/components/landing/CTASection';
import { Helmet } from 'react-helmet-async';
import { Mail, BarChart3, FileText, Bot, Sparkles, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';

const features = [
  {
    id: 'klantenservice',
    icon: Mail,
    title: 'AI Klantenservice',
    subtitle: 'Beantwoord 80% van je mails automatisch',
    description: 'Servio leest je mails, begrijpt de context en stelt professionele antwoorden voor. Jij keurt alleen nog goed.',
    details: [
      'Intelligente reply-suggesties op basis van context',
      'Sentiment-analyse om urgente berichten te prioriteren',
      'Automatische categorisering en tagging',
      'Leer je communicatiestijl in 24 uur',
    ],
    result: 'Bespaar 6+ uur per week op e-mail',
  },
  {
    id: 'facturen',
    icon: FileText,
    title: 'Automatische Factuurverwerking',
    subtitle: 'Upload een factuur, klaar in seconden',
    description: 'Nooit meer handmatig gegevens overtypen. AI herkent bedragen, BTW, leveranciers en categorieën automatisch.',
    details: [
      'OCR-herkenning voor alle factuurformaten',
      'Automatische BTW-extractie en -berekening',
      'Slimme leverancier- en datumdetectie',
      'Direct klaar voor je boekhouding',
    ],
    result: 'Geen handmatig invoeren meer',
  },
  {
    id: 'financieel',
    icon: BarChart3,
    title: 'Realtime Financieel Dashboard',
    subtitle: 'Altijd weten waar je staat',
    description: 'Overzichtelijk dashboard met je omzet, uitgaven en winst. Nooit meer verrast worden door je cijfers.',
    details: [
      'Live tracking van inkomsten en uitgaven',
      'Winst- en verliesprognoses',
      'Categorieanalyse per periode',
      'Exporteer naar Excel, PDF of je boekhouder',
    ],
    result: '24/7 financieel inzicht',
  },
  {
    id: 'ai-assistent',
    icon: Bot,
    title: 'AI Boekhoudassistent',
    subtitle: 'Stel vragen in normale taal',
    description: '"Hoeveel heb ik dit kwartaal uitgegeven aan software?" Stel je vraag en krijg direct antwoord.',
    details: [
      'Vraag naar omzet, winst of kostenposten',
      'Automatische BTW-reservering berekeningen',
      'Vergelijk periodes en ontdek trends',
      'Geen boekhoudkennis nodig',
    ],
    result: 'Inzicht zonder zoeken',
  },
];

export default function Features() {
  return (
    <>
      <Helmet>
        <title>Features - AI Klantenservice & Automatische Boekhouding | Servio</title>
        <meta 
          name="description" 
          content="Ontdek alle features van Servio: AI-gestuurde klantenservice die 80% van je mails beantwoordt, automatische factuurverwerking, en realtime financieel dashboard." 
        />
        <meta 
          name="keywords" 
          content="AI klantenservice, automatische factuurverwerking, boekhoudsoftware ZZP, financieel dashboard, email automatisering, administratie software" 
        />
        <link rel="canonical" href="https://getservio.co/features" />
        
        <meta property="og:title" content="Features - AI Klantenservice & Automatische Boekhouding | Servio" />
        <meta property="og:description" content="AI die 80% van je mails beantwoordt, automatische factuurverwerking, en realtime financieel inzicht." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://getservio.co/features" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingHeader />
        
        <main>
          {/* Hero */}
          <section className="pt-32 pb-20 md:pt-44 md:pb-28">
            <div className="container mx-auto px-6">
              <div className="max-w-3xl mx-auto text-center">
                <span className="text-sm font-medium text-primary mb-4 block">Features</span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.02em] text-foreground mb-6 leading-tight">
                  Automatiseer je administratie
                  <br />
                  <span className="text-primary">met AI die werkt.</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
                  Vier krachtige modules die samenwerken om je bedrijf te runnen. 
                  Minder handwerk, meer resultaat.
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
                <div className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto`}>
                  {/* Content */}
                  <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                      <feature.icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-foreground mb-2">
                      {feature.title}
                    </h2>
                    <p className="text-lg text-primary font-medium mb-4">
                      {feature.subtitle}
                    </p>
                    <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                      {feature.description}
                    </p>
                    <ul className="space-y-4 mb-8">
                      {feature.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                          <span className="text-foreground">{detail}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary font-medium">
                      <ArrowRight className="w-4 h-4" />
                      {feature.result}
                    </div>
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
                        <div className="h-full rounded-lg bg-card border border-border/40 p-5">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <feature.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                            </div>
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
                  Veilig & AVG-compliant
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto mb-8">
                  Je data is veilig bij ons. Enterprise-grade 256-bit encryptie, 
                  GDPR-compliant en opgeslagen in beveiligde datacenters binnen de EU.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                  {['256-bit encryptie', 'GDPR/AVG compliant', 'EU datacenters', 'Dagelijkse backups'].map((item, i) => (
                    <span key={i} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      {item}
                    </span>
                  ))}
                </div>
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
