import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { CTASection } from '@/components/landing/CTASection';
import { Helmet } from 'react-helmet-async';
import { Heart, Lightbulb, Users, Target } from 'lucide-react';

const values = [
  {
    icon: Target,
    title: 'Focus op resultaat',
    description: 'Geen overbodige features. Alles wat we bouwen moet tijd besparen of overzicht geven.',
  },
  {
    icon: Heart,
    title: 'Passie voor ondernemers',
    description: 'We begrijpen je uitdagingen omdat we zelf ondernemer zijn. Elke feature is met jou in gedachten.',
  },
  {
    icon: Lightbulb,
    title: 'AI met een doel',
    description: 'Technologie is een middel, geen doel. We bouwen AI die echt helpt, niet alleen indruk maakt.',
  },
  {
    icon: Users,
    title: 'Samen bouwen',
    description: 'Jouw feedback vormt onze roadmap. Servio groeit met de input van echte ondernemers.',
  },
];

export default function About() {
  return (
    <>
      <Helmet>
        <title>Over Ons - Servio | AI Bedrijfsassistent voor Nederlandse Ondernemers</title>
        <meta 
          name="description" 
          content="Servio is gebouwd door ondernemers, voor ondernemers. Onze missie: ZZP'ers en MKB'ers helpen met AI-gestuurde administratie en klantenservice." 
        />
        <meta 
          name="keywords" 
          content="Servio over ons, Nederlandse startup, bedrijfssoftware Nederland, AI software ondernemers" 
        />
        <link rel="canonical" href="https://getservio.co/about" />
        
        <meta property="og:title" content="Over Ons - Servio | AI Bedrijfsassistent" />
        <meta property="og:description" content="Gebouwd door ondernemers, voor ondernemers. Ontdek onze missie." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://getservio.co/about" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingHeader />
        
        <main>
          {/* Hero */}
          <section className="pt-32 pb-20 md:pt-44 md:pb-28">
            <div className="container mx-auto px-6">
              <div className="max-w-3xl mx-auto text-center">
                <span className="text-sm font-medium text-primary mb-4 block">Over Servio</span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.02em] text-foreground mb-6 leading-tight">
                  Gebouwd voor
                  <br />
                  <span className="text-primary">ondernemers.</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
                  Servio bestaat om ondernemers rust en overzicht te geven. 
                  Minder administratie, meer tijd voor wat écht telt.
                </p>
              </div>
            </div>
          </section>

          {/* Mission */}
          <section className="py-20 md:py-28 bg-muted/30">
            <div className="container mx-auto px-6">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-foreground mb-8 text-center">
                  Onze missie
                </h2>
                <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                  <p>
                    Als ondernemer heb je al genoeg aan je hoofd. Je wilt focussen op je klanten, 
                    je product en je groei — niet op eindeloze e-mails en repetitieve administratie.
                  </p>
                  <p>
                    Daarom hebben we Servio gebouwd: <strong className="text-foreground">een slimme assistent die je 
                    helpt met alles wat je afleidt van waar je écht goed in bent</strong>. Van klantenservice 
                    tot boekhouding, van facturen tot financieel inzicht.
                  </p>
                  <p>
                    Met AI als partner, niet als vervanging. Je houdt altijd de controle, 
                    maar met minder gedoe en meer rust. Zo kun je doen waar je van houdt: ondernemen.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="py-20 md:py-28">
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
                {[
                  { value: '500+', label: 'Actieve ondernemers' },
                  { value: '8+ uur', label: 'Bespaard per week' },
                  { value: '80%', label: 'Mails automatisch' },
                  { value: '4.8/5', label: 'Klanttevredenheid' },
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Values */}
          <section className="py-20 md:py-28 bg-muted/30">
            <div className="container mx-auto px-6">
              <div className="max-w-xl mx-auto text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-foreground mb-4">
                  Onze waarden
                </h2>
                <p className="text-muted-foreground">
                  Wat ons drijft bij alles wat we bouwen.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {values.map((value, index) => (
                  <article key={index} className="p-8 rounded-xl bg-card border border-border/40">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                      <value.icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      {value.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* Team note */}
          <section className="py-20 md:py-28">
            <div className="container mx-auto px-6">
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-foreground mb-6">
                  Een Nederlands product
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                  Servio wordt gebouwd door een klein, toegewijd team in Nederland. 
                  We geloven in kwaliteit boven kwantiteit, en in het bouwen van 
                  software die je echt helpt — niet alleen nu, maar voor de lange termijn.
                </p>
                <p className="text-sm text-muted-foreground">
                  Made with ❤️ in Nederland
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
