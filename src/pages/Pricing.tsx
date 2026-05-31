import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Check, X, Star, Zap, Crown, Loader2, Clock, Sparkles, ShieldCheck, CreditCard, Flame, TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useSubscription, SUBSCRIPTION_TIERS } from '@/hooks/useSubscription';
import { toast } from 'sonner';

const Pricing = () => {
  const { user, signOut } = useAuth();
  const { subscriptionStatus, createCheckoutSession, getCurrentTier, openCustomerPortal, isLoading } = useSubscription();
  const [yearly, setYearly] = useState(false);

  // Prijzen — jaarlijks = 10 maanden (2 gratis)
  const PRICING = {
    starter: { monthly: 9.99, yearly: 99.9 },
    pro: { monthly: 29.99, yearly: 299.9 },
    business: { monthly: 79.99, yearly: 799.9 },
  };

  const displayPrice = (tier: keyof typeof PRICING) => {
    const p = PRICING[tier];
    if (yearly) {
      const perMonth = p.yearly / 12;
      return { main: `€${perMonth.toFixed(2)}`, period: '/mnd', sub: `€${p.yearly.toFixed(2)} per jaar` };
    }
    return { main: `€${p.monthly.toFixed(2)}`, period: '/mnd', sub: 'Maandelijks opzegbaar' };
  };

  const plans = [
    {
      name: 'Starter', tier: 'starter', description: 'Perfect voor freelancers en starters',
      icon: <Star className="h-7 w-7" />, features: SUBSCRIPTION_TIERS.starter.features,
      buttonText: 'Start Starter', variant: 'outline' as const, popular: false,
      productId: SUBSCRIPTION_TIERS.starter.product_id, highlight: 'Ideaal om te beginnen',
    },
    {
      name: 'Pro', tier: 'pro', description: 'Voor groeiende bedrijven',
      icon: <Zap className="h-7 w-7" />, features: SUBSCRIPTION_TIERS.pro.features,
      buttonText: 'Kies Pro', variant: 'default' as const, popular: true,
      productId: SUBSCRIPTION_TIERS.pro.product_id, highlight: 'Meest gekozen',
    },
    {
      name: 'Business', tier: 'business', description: 'Voor teams en grote organisaties',
      icon: <Crown className="h-7 w-7" />, features: SUBSCRIPTION_TIERS.business.features,
      buttonText: 'Kies Business', variant: 'outline' as const, popular: false,
      productId: SUBSCRIPTION_TIERS.business.product_id, highlight: 'Onbeperkte kracht',
    },
  ];

  const handleSubscribe = async (tier: string, planName: string) => {
    if (!user) {
      toast.error('Log eerst in om te abonneren');
      window.location.href = '/auth';
      return;
    }
    toast.info(`Checkout sessie wordt geopend voor ${planName}...`);
    await createCheckoutSession(tier);
  };

  const isCurrentPlan = (productId: string) => subscriptionStatus?.product_id === productId;

  // Vergelijkingstabel — Servio vs concurrenten
  const comparison = [
    { feature: 'Nederlandse interface & support', servio: true, moneybird: true, e_boekhouden: true, exact: 'partial' },
    { feature: 'AI email afhandeling', servio: true, moneybird: false, e_boekhouden: false, exact: false },
    { feature: 'Automatische BTW-aangifte', servio: true, moneybird: true, e_boekhouden: true, exact: true },
    { feature: 'OCR voor bonnetjes', servio: true, moneybird: true, e_boekhouden: 'partial', exact: true },
    { feature: 'Slimme AI categorisering', servio: true, moneybird: false, e_boekhouden: false, exact: 'partial' },
    { feature: 'Onbeperkte facturen (Pro)', servio: true, moneybird: false, e_boekhouden: true, exact: true },
    { feature: 'Urenregistratie inbegrepen', servio: true, moneybird: 'partial', e_boekhouden: false, exact: true },
    { feature: 'Vanaf prijs per maand', servio: '€9,99', moneybird: '€14', e_boekhouden: '€7,50', exact: '€39' },
  ];

  const renderCell = (v: boolean | string) => {
    if (v === true) return <Check className="h-5 w-5 text-success mx-auto" />;
    if (v === false) return <X className="h-5 w-5 text-muted-foreground/40 mx-auto" />;
    if (v === 'partial') return <span className="text-xs text-warning font-medium">Beperkt</span>;
    return <span className="text-sm font-medium">{v}</span>;
  };

  // Klantlogo's — placeholder tekst-badges (vervang door echte logo's wanneer beschikbaar)
  const customerLogos = ['Studio Mees', 'BV Klimaat', 'Hoekstra Advies', 'De Jong ZZP', 'Atelier Roos', 'Vink IT'];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} onLogout={signOut} />

      <div className="flex-1 flex">
        <Sidebar />

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 space-y-10 md:space-y-12">
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Servio Pakketten</h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Kies het pakket dat bij jouw bedrijf past. Direct opzegbaar.
              </p>

              {/* Trust badges */}
              <div className="flex gap-2 justify-center flex-wrap">
                <Badge variant="secondary" className="bg-success/10 text-success border-success/20 px-3 py-1">
                  <Clock className="h-3 w-3 mr-1" /> {yearly ? 'Inclusief 14 dagen gratis proberen' : '14 dagen gratis proberen'}
                </Badge>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
                  <CreditCard className="h-3 w-3 mr-1" /> Geen creditcard nodig
                </Badge>
                <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 px-3 py-1">
                  <Check className="h-3 w-3 mr-1" /> Opzeggen via accountinstellingen
                </Badge>
                <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20 px-3 py-1">
                  <ShieldCheck className="h-3 w-3 mr-1" /> 30 dagen geld-terug garantie
                </Badge>
              </div>

              {/* Monthly/Yearly toggle */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <span className={`text-sm ${!yearly ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>Maandelijks</span>
                <Switch checked={yearly} onCheckedChange={setYearly} />
                <span className={`text-sm ${yearly ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                  Jaarlijks
                </span>
                <Badge className="bg-success text-white">Bespaar 17%</Badge>
              </div>

              {subscriptionStatus?.subscription_status === 'active' && (
                <div className="mt-4">
                  <Button onClick={openCustomerPortal} variant="outline">Beheer Abonnement</Button>
                </div>
              )}
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => {
                const price = displayPrice(plan.tier as keyof typeof PRICING);
                return (
                  <Card
                    key={index}
                    className={`relative shadow-card hover:shadow-elevated transition-all duration-300 flex flex-col ${
                      plan.popular
                        ? 'border-2 border-primary ring-4 ring-primary/20 md:scale-110 z-10'
                        : 'border-border'
                    } ${isCurrentPlan(plan.productId) ? 'ring-2 ring-success bg-success/5' : ''}`}
                  >
                    {plan.popular && (
                      <>
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                          <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg px-4 py-1.5 text-sm font-semibold animate-pulse">
                            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Meest Populair
                          </Badge>
                        </div>
                        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 z-20 whitespace-nowrap">
                          <Badge className="bg-warning/90 text-warning-foreground text-xs px-2 py-1 shadow-card">
                            <Flame className="h-3 w-3 mr-1" /> Meest gekozen door ZZP'ers in NL
                          </Badge>
                        </div>
                      </>
                    )}

                    <div className="absolute -top-3 right-4">
                      <Badge variant="outline" className="bg-background border-success/30 text-success text-xs px-2 py-0.5">
                        <Clock className="h-3 w-3 mr-1" /> {yearly ? 'Inclusief 14 dagen gratis proberen' : '14 dagen gratis proberen'}
                      </Badge>
                    </div>

                    {isCurrentPlan(plan.productId) && (
                      <div className="absolute -top-3 left-4">
                        <Badge className="bg-success text-white shadow-card text-xs">
                          <Check className="h-3 w-3 mr-1" /> Jouw Pakket
                        </Badge>
                      </div>
                    )}

                    <CardHeader className={`text-center space-y-4 pb-4 ${plan.popular ? 'pt-10' : 'pt-6'}`}>
                      <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center shadow-card ${
                        plan.popular ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground' : 'bg-secondary text-foreground'
                      }`}>{plan.icon}</div>

                      <div className="space-y-1">
                        <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                        <p className="text-xs text-primary font-medium">{plan.highlight}</p>
                      </div>

                      <div className="space-y-1 pt-2">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-4xl font-bold text-foreground">{price.main}</span>
                          <span className="text-muted-foreground text-sm">{price.period}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{price.sub}</p>
                      </div>

                      <Button
                        variant={isCurrentPlan(plan.productId) ? 'outline' : plan.variant}
                        size="lg"
                        className={`w-full shadow-card h-12 font-semibold ${
                          plan.popular && !isCurrentPlan(plan.productId)
                            ? 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground'
                            : ''
                        }`}
                        onClick={() => handleSubscribe(plan.tier, plan.name)}
                        disabled={isCurrentPlan(plan.productId) || isLoading}
                      >
                        {isLoading ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Laden...</>
                        ) : isCurrentPlan(plan.productId) ? (
                          <><Check className="w-4 h-4 mr-2" /> Actief Abonnement</>
                        ) : (plan.buttonText)}
                      </Button>
                    </CardHeader>

                    <CardContent className="flex-1 pt-0">
                      <div className="border-t border-border pt-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Inbegrepen:</p>
                        <ul className="space-y-2.5">
                          {plan.features.map((feature, fi) => (
                            <li key={fi} className="flex items-start gap-3">
                              <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-foreground leading-tight">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Klantlogo's */}
            <div className="max-w-5xl mx-auto text-center space-y-4">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                <TrendingUp className="h-4 w-4 inline mr-1" /> Vertrouwd door honderden ZZP'ers en MKB-bedrijven
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 opacity-60">
                {customerLogos.map((name) => (
                  <div key={name} className="text-base md:text-lg font-bold text-muted-foreground tracking-tight">
                    {name}
                  </div>
                ))}
              </div>
            </div>

            {/* Vergelijkingstabel */}
            <div className="max-w-5xl mx-auto space-y-4">
              <h2 className="text-2xl font-bold text-center text-foreground">Vergelijk Servio met alternatieven</h2>
              <p className="text-center text-muted-foreground text-sm">Waarom ZZP'ers en MKB-bedrijven Servio kiezen</p>
              <Card className="shadow-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Functie</TableHead>
                      <TableHead className="text-center bg-primary/5 font-bold text-primary">Servio</TableHead>
                      <TableHead className="text-center">Moneybird</TableHead>
                      <TableHead className="text-center">e-Boekhouden</TableHead>
                      <TableHead className="text-center">Exact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparison.map((row) => (
                      <TableRow key={row.feature}>
                        <TableCell className="font-medium">{row.feature}</TableCell>
                        <TableCell className="text-center bg-primary/5">{renderCell(row.servio)}</TableCell>
                        <TableCell className="text-center">{renderCell(row.moneybird)}</TableCell>
                        <TableCell className="text-center">{renderCell(row.e_boekhouden)}</TableCell>
                        <TableCell className="text-center">{renderCell(row.exact)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
              <p className="text-xs text-muted-foreground text-center">
                Prijzen en functies van concurrenten gebaseerd op publieke informatie, kan afwijken. Laatst bijgewerkt: 2026.
              </p>
            </div>

            {/* FAQ Section — uitgebreid met Accordion */}
            <div className="max-w-3xl mx-auto space-y-4">
              <h2 className="text-2xl font-bold text-center text-foreground">Veelgestelde Vragen</h2>
              <Accordion type="single" collapsible className="w-full">
                {[
                  { q: 'Hoe werkt de gratis trial?', a: 'Je krijgt 14 dagen volledige toegang tot alle functies van het Pro plan. Geen creditcard nodig om te starten. Na de trial kies je een plan of stopt het automatisch zonder kosten.' },
                  { q: 'Kan ik op elk moment opzeggen?', a: 'Ja, opzeggen kan altijd via je accountinstellingen onder Abonnement → Beheer abonnement. Je behoudt toegang tot het einde van de betaalde periode.' },
                  { q: 'Is er een geld-terug-garantie?', a: 'Ja, we bieden 30 dagen geld-terug garantie. Niet tevreden binnen 30 dagen na aankoop? Stuur ons een mail en je krijgt het volledige bedrag terug — zonder vragen.' },
                  { q: 'Kan ik upgraden of downgraden?', a: 'Ja, je kunt op elk moment van plan wisselen via het abonnementsbeheer. Bij upgrade reken je alleen het verschil pro-rata bij; bij downgrade gaat de wijziging in bij de volgende factuurperiode.' },
                  { q: 'Welke betaalmethodes accepteren jullie?', a: 'We accepteren iDEAL, Bancontact, alle gangbare creditcards (Visa, Mastercard, AMEX), Apple Pay en Google Pay via onze beveiligde Stripe checkout.' },
                  { q: 'Zijn mijn financiële gegevens veilig?', a: 'Absoluut. Alle data wordt versleuteld opgeslagen in EU-datacenters, en we voldoen aan AVG/GDPR. We delen nooit gegevens met derden voor marketingdoeleinden.' },
                  { q: 'Wat gebeurt er met mijn data als ik opzeg?', a: 'Je kunt al je facturen, bonnetjes en transacties exporteren als PDF/Excel/CSV. Na 30 dagen wordt je data permanent verwijderd, tenzij je verzoekt om eerder te verwijderen.' },
                  { q: 'Heb ik kennis van boekhouden nodig?', a: 'Nee. Servio is ontworpen voor ZZP\'ers zonder boekhoudkundige achtergrond. AI helpt bij categorisering, BTW-berekening en factuuropmaak. Wel raden we aan een boekhouder te raadplegen voor je belastingaangifte.' },
                  { q: 'Hoeveel maandelijkse facturen kan ik versturen?', a: 'Starter: 25 facturen/maand. Pro: onbeperkt. Business: onbeperkt + team-functies. Zie de feature-vergelijking hierboven voor alle limieten.' },
                  { q: 'Bieden jullie jaarlijkse korting?', a: 'Ja! Bij jaarlijkse betaling krijg je 2 maanden gratis — dat is ~17% korting op het totaal. Gebruik de toggle bovenaan om de jaarprijs te zien.' },
                ].map((faq, i) => (
                  <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger className="text-left font-medium">{faq.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* CTA Section */}
            <div className="text-center space-y-4 py-8 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl border border-border max-w-4xl mx-auto">
              <ShieldCheck className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Klaar om te starten?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                14 dagen gratis trial. Geen creditcard. Opzeggen wanneer je wilt. 30 dagen geld-terug garantie.
              </p>
              {!user ? (
                <Button size="lg" className="shadow-card h-12 px-8" onClick={() => window.location.href = '/auth'}>
                  Start je gratis trial
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">Kies hierboven een pakket om te starten</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Pricing;
