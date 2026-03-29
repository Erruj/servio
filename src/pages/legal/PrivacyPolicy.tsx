import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Helmet } from 'react-helmet-async';

export default function PrivacyPolicy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | Servio</title>
        <meta name="description" content="Lees ons privacybeleid en hoe Servio omgaat met je persoonsgegevens." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingHeader />
        
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-8">
                Privacy Policy
              </h1>
              
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-lg text-muted-foreground mb-8">
                  Laatst bijgewerkt: {new Date().toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">1. Inleiding</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Servio ("wij", "ons", "onze") respecteert de privacy van alle gebruikers van onze diensten. 
                    Deze privacyverklaring legt uit welke gegevens wij verzamelen, hoe wij deze gebruiken, 
                    en welke rechten u heeft met betrekking tot uw persoonsgegevens.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">2. Gegevens die wij verzamelen</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Wij verzamelen de volgende categorieën persoonsgegevens:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Accountgegevens: naam, e-mailadres, bedrijfsnaam</li>
                    <li>Gebruiksgegevens: hoe u onze diensten gebruikt</li>
                    <li>Communicatiegegevens: e-mails die via ons platform worden verwerkt</li>
                    <li>Financiële gegevens: facturen en bonnetjes die u uploadt</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">3. Hoe wij uw gegevens gebruiken</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Wij gebruiken uw gegevens voor de volgende doeleinden:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Het leveren en verbeteren van onze diensten</li>
                    <li>Het automatiseren van uw e-mailbeantwoording met AI</li>
                    <li>Het verwerken van facturen en bonnetjes</li>
                    <li>Het versturen van belangrijke servicemededelingen</li>
                    <li>Het voldoen aan wettelijke verplichtingen</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">4. Gegevensbeveiliging</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Wij nemen passende technische en organisatorische maatregelen om uw persoonsgegevens 
                    te beschermen tegen ongeoorloofde toegang, verlies of misbruik. Al uw gegevens worden 
                    versleuteld opgeslagen en verzonden.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">5. Uw rechten</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Op grond van de AVG heeft u de volgende rechten:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Recht op inzage in uw persoonsgegevens</li>
                    <li>Recht op rectificatie van onjuiste gegevens</li>
                    <li>Recht op verwijdering van uw gegevens</li>
                    <li>Recht op beperking van de verwerking</li>
                    <li>Recht op overdraagbaarheid van gegevens</li>
                    <li>Recht om bezwaar te maken tegen verwerking</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">6. Contact</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Heeft u vragen over dit privacybeleid of wilt u uw rechten uitoefenen? 
                    Neem dan contact met ons op via <a href="mailto:info@getservio.co" className="text-primary hover:underline">info@getservio.co</a>.
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
