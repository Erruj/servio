import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { CTASection } from '@/components/landing/CTASection';
import { Helmet } from 'react-helmet-async';
import { Heart, Lightbulb, Users } from 'lucide-react';

const values = [
  {
    icon: Heart,
    title: 'Passie voor ondernemers',
    description: 'We begrijpen de uitdagingen van ondernemers omdat we zelf ondernemer zijn. Elke feature is gebouwd met jouw succes in gedachten.',
  },
  {
    icon: Lightbulb,
    title: 'Innovatie met een doel',
    description: 'AI is geen doel op zich, maar een middel om jouw werk makkelijker te maken. We bouwen alleen features die echt waarde toevoegen.',
  },
  {
    icon: Users,
    title: 'Samen groeien',
    description: 'Jouw feedback vormt onze roadmap. We bouwen Servio samen met onze gebruikers, voor onze gebruikers.',
  },
];

export default function About() {
  return (
    <>
      <Helmet>
        <title>Over Servio - De slimme bedrijfsassistent voor ondernemers</title>
        <meta name="description" content="Servio is gebouwd om ondernemers rust en overzicht te geven. Ontdek onze missie en waarden." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingHeader />
        
        <main>
          {/* Hero */}
          <section className="pt-32 pb-20 md:pt-44 md:pb-28">
            <div className="container mx-auto px-6">
              <div className="max-w-3xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.02em] text-foreground mb-6 leading-tight">
                  Gebouwd voor
                  <br />
                  <span className="text-primary">ondernemers.</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
                  Servio is gebouwd om ondernemers rust en overzicht te geven. 
                  Geen gedoe, geen complexiteit — gewoon tools die werken.
                </p>
              </div>
            </div>
          </section>

          {/* Vision */}
          <section className="py-20 md:py-28 bg-muted/30">
            <div className="container mx-auto px-6">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-foreground mb-8 text-center">
                  Onze visie
                </h2>
                <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed space-y-6">
                  <p>
                    Als ondernemer heb je al genoeg aan je hoofd. Je wilt focussen op je klanten, je product en je groei — 
                    niet op eindeloze administratie en repetitieve taken.
                  </p>
                  <p>
                    Daarom hebben we Servio gebouwd: een slimme assistent die je helpt met alles wat je afleidt 
                    van waar je écht goed in bent. Van klantenservice tot boekhouding, van facturen tot financieel inzicht.
                  </p>
                  <p>
                    Met AI als partner, niet als vervanging. Je houdt altijd de controle, maar met minder gedoe 
                    en meer rust. Zo kun je doen waar je van houdt: ondernemen.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Values */}
          <section className="py-20 md:py-28">
            <div className="container mx-auto px-6">
              <div className="max-w-xl mx-auto text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-foreground mb-4">
                  Onze waarden
                </h2>
                <p className="text-muted-foreground">
                  Wat ons drijft bij alles wat we doen.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                {values.map((value, index) => (
                  <div key={index} className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                      <value.icon className="w-7 h-7 text-primary" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      {value.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Team note */}
          <section className="py-20 md:py-28 bg-muted/30">
            <div className="container mx-auto px-6">
              <div className="max-w-2xl mx-auto text-center">
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
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
