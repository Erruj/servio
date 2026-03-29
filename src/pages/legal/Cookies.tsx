import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Helmet } from 'react-helmet-async';

export default function Cookies() {
  return (
    <>
      <Helmet>
        <title>Cookiebeleid | Servio</title>
        <meta name="description" content="Lees ons cookiebeleid en hoe Servio cookies gebruikt." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingHeader />
        
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-8">
                Cookiebeleid
              </h1>
              
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-lg text-muted-foreground mb-8">
                  Laatst bijgewerkt: {new Date().toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">Wat zijn cookies?</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Cookies zijn kleine tekstbestanden die op uw computer of mobiele apparaat worden 
                    opgeslagen wanneer u onze website bezoekt. Ze helpen ons om de website correct te 
                    laten functioneren, de beveiliging te verbeteren, en inzicht te krijgen in hoe 
                    bezoekers de website gebruiken.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">Welke cookies gebruiken wij?</h2>
                  
                  <h3 className="text-xl font-medium text-foreground mt-6 mb-3">Noodzakelijke cookies</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Deze cookies zijn essentieel voor het functioneren van de website. Zonder deze 
                    cookies kunnen bepaalde functies niet werken.
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Sessie-cookies voor inloggen en authenticatie</li>
                    <li>Beveiligingscookies voor bescherming tegen fraude</li>
                    <li>Cookies voor het onthouden van uw voorkeuren</li>
                  </ul>

                  <h3 className="text-xl font-medium text-foreground mt-6 mb-3">Analytische cookies</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Deze cookies helpen ons te begrijpen hoe bezoekers onze website gebruiken, zodat 
                    we deze kunnen verbeteren.
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Statistieken over websitebezoek</li>
                    <li>Informatie over welke pagina's het meest bezocht worden</li>
                    <li>Foutmeldingen en prestatiemetingen</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">Cookies beheren</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    U kunt uw browserinstellingen aanpassen om cookies te weigeren of om een melding 
                    te ontvangen wanneer cookies worden geplaatst. Houd er rekening mee dat het 
                    uitschakelen van cookies de functionaliteit van de website kan beïnvloeden.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">Bewaartermijn</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Sessie-cookies worden verwijderd wanneer u uw browser sluit. Permanente cookies 
                    blijven op uw apparaat totdat ze verlopen of tot u ze handmatig verwijdert. 
                    Onze analytische cookies verlopen na maximaal 2 jaar.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">Wijzigingen</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Wij kunnen dit cookiebeleid van tijd tot tijd bijwerken. Wij raden u aan dit 
                    beleid regelmatig te raadplegen.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">Contact</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Heeft u vragen over ons gebruik van cookies? Neem contact met ons op via <a href="mailto:info@getservio.co" className="text-primary hover:underline">info@getservio.co</a>.
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
