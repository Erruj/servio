import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Helmet } from 'react-helmet-async';

export default function Terms() {
  return (
    <>
      <Helmet>
        <title>Algemene Voorwaarden | Servio</title>
        <meta name="description" content="Lees de algemene voorwaarden van Servio voor het gebruik van onze diensten." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingHeader />
        
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-8">
                Algemene Voorwaarden
              </h1>
              
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-lg text-muted-foreground mb-8">
                  Laatst bijgewerkt: {new Date().toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">1. Definities</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    In deze algemene voorwaarden wordt verstaan onder:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                    <li><strong>Servio:</strong> de aanbieder van de software en diensten</li>
                    <li><strong>Gebruiker:</strong> de natuurlijke of rechtspersoon die gebruik maakt van Servio</li>
                    <li><strong>Diensten:</strong> alle door Servio aangeboden producten en functionaliteiten</li>
                    <li><strong>Account:</strong> de persoonlijke toegang tot het Servio-platform</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">2. Toepasselijkheid</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Deze algemene voorwaarden zijn van toepassing op alle aanbiedingen, overeenkomsten en 
                    leveringen van diensten door Servio. Door gebruik te maken van onze diensten gaat u 
                    akkoord met deze voorwaarden.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">3. Gebruik van de diensten</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    U bent verantwoordelijk voor:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Het verstrekken van correcte en volledige informatie</li>
                    <li>Het vertrouwelijk houden van uw inloggegevens</li>
                    <li>Alle activiteiten die onder uw account plaatsvinden</li>
                    <li>Naleving van toepasselijke wet- en regelgeving</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">4. Abonnementen en betaling</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Servio biedt verschillende abonnementsvormen aan. Alle prijzen zijn exclusief BTW 
                    tenzij anders vermeld. Betalingen dienen vooraf te geschieden. Bij niet-tijdige 
                    betaling behouden wij ons het recht voor om de toegang tot uw account op te schorten.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">5. Proefperiode</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Nieuwe gebruikers kunnen gebruik maken van een gratis proefperiode van 14 dagen. 
                    Tijdens deze periode heeft u toegang tot alle functionaliteiten. Na afloop van de 
                    proefperiode wordt uw account automatisch geconverteerd naar een betaald abonnement, 
                    tenzij u het account annuleert.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">6. Intellectueel eigendom</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Alle intellectuele eigendomsrechten op de software, documentatie en andere materialen 
                    blijven bij Servio. U verkrijgt een niet-exclusief, niet-overdraagbaar gebruiksrecht 
                    voor de duur van uw abonnement.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">7. Aansprakelijkheid</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Servio is niet aansprakelijk voor indirecte schade, gevolgschade of gederfde winst. 
                    Onze totale aansprakelijkheid is beperkt tot het bedrag dat u in de 12 maanden 
                    voorafgaand aan de schadeclaim heeft betaald.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">8. Opzegging</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    U kunt uw abonnement op elk moment opzeggen. Na opzegging behoudt u toegang tot 
                    uw account tot het einde van de lopende factureringsperiode. Wij zijn gerechtigd 
                    om uw account te beëindigen bij schending van deze voorwaarden.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">9. Wijzigingen</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Wij behouden ons het recht voor om deze voorwaarden te wijzigen. Bij materiële 
                    wijzigingen zullen wij u hiervan minimaal 30 dagen van tevoren op de hoogte stellen.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">10. Toepasselijk recht</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd 
                    aan de bevoegde rechter te Amsterdam.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">11. Contact</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Voor vragen over deze algemene voorwaarden kunt u contact opnemen via info@servio.nl.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </main>
        
        <LandingFooter />
      </div>
    </>
  );
}
