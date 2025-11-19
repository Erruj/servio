import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

const Pricing = () => {
  const { user, signOut } = useAuth();

  const plans = [
    {
      name: 'Free',
      price: '€0',
      period: '/maand',
      description: 'Perfect om te starten',
      icon: <Star className="h-6 w-6" />,
      features: [
        '50 AI antwoorden per maand',
        'Basis email analyse',
        '3 aangepaste templates',
        'Email ondersteuning',
        'Dashboard analytics'
      ],
      buttonText: 'Gratis starten',
      variant: 'outline' as const,
      popular: false
    },
    {
      name: 'Pro',
      price: '€49',
      period: '/maand',
      description: 'Voor groeiende bedrijven',
      icon: <Zap className="h-6 w-6" />,
      features: [
        '1.000 AI antwoorden per maand',
        'Geavanceerde AI analyse',
        'Onbeperkte templates',
        'Prioriteit ondersteuning',
        'Geavanceerde analytics',
        'API toegang',
        'Integraties (Gmail, Outlook)',
        'Custom branding'
      ],
      buttonText: 'Pro proberen',
      variant: 'default' as const,
      popular: true
    },
    {
      name: 'Business',
      price: '€149',
      period: '/maand',
      description: 'Voor grote organisaties',
      icon: <Crown className="h-6 w-6" />,
      features: [
        'Onbeperkte AI antwoorden',
        'AI training op je data',
        'White-label oplossing',
        'Dedicated account manager',
        'SLA garantie (99.9% uptime)',
        'Advanced security features',
        'Custom integraties',
        'Team management',
        'Bulk operations'
      ],
      buttonText: 'Contact opnemen',
      variant: 'outline' as const,
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} onLogout={signOut} />
      
      <div className="flex-1 flex">
        <Sidebar />
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-foreground">💰 Pricing</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Kies het Servio-pakket dat bij je past. Start gratis en schaal op wanneer je groeit.
              </p>
              <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                30 dagen geld-terug-garantie
              </Badge>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <Card 
                  key={index}
                  className={`relative shadow-card hover:shadow-elevated transition-all duration-200 ${
                    plan.popular ? 'border-primary/50 ring-1 ring-primary/20' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground shadow-card">
                        🌟 Meest Populair
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center space-y-4 pb-6">
                    <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center ${
                      plan.popular ? 'bg-primary/20 text-primary' : 'bg-secondary text-foreground'
                    }`}>
                      {plan.icon}
                    </div>
                    
                    <div>
                      <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-baseline justify-center space-x-1">
                        <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                        <span className="text-muted-foreground">{plan.period}</span>
                      </div>
                    </div>
                    
                    <Button 
                      variant={plan.variant}
                      size="lg" 
                      className={`w-full shadow-card ${
                        plan.popular ? 'bg-primary hover:bg-primary/90' : ''
                      }`}
                      onClick={() => {
                        if (plan.name === 'Free') {
                          window.location.href = '/signup';
                        } else if (plan.name === 'Pro') {
                          window.location.href = '/signup';
                        } else {
                          // Business plan - contact
                          window.open('mailto:sales@servio.nl?subject=Business Plan Interesse', '_blank');
                        }
                      }}
                    >
                      {plan.buttonText}
                    </Button>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center space-x-3">
                          <Check className="h-4 w-4 text-success flex-shrink-0" />
                          <span className="text-sm text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* FAQ Section */}
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold text-center text-foreground">❓ Veelgestelde Vragen</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    q: 'Kan ik upgraden of downgraden?',
                    a: 'Ja, je kunt op elk moment van plan wisselen. Wijzigingen gaan in vanaf de volgende facturatieperiode.'
                  },
                  {
                    q: 'Hoe werkt de AI-training?',
                    a: 'In het Business plan kunnen we de AI trainen op jouw specifieke bedrijfsdata en tone-of-voice.'
                  },
                  {
                    q: 'Welke integraties zijn beschikbaar?',
                    a: 'We ondersteunen Gmail, Outlook, Zapier, Slack en vele andere populaire tools.'
                  },
                  {
                    q: 'Is er een setup fee?',
                    a: 'Nee, er zijn geen setup kosten. Je betaalt alleen je maandelijkse abonnement.'
                  }
                ].map((faq, index) => (
                  <Card key={index} className="shadow-subtle">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                      <p className="text-sm text-muted-foreground">{faq.a}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center space-y-4 py-8">
              <h2 className="text-2xl font-bold text-foreground">🚀 Klaar om te starten?</h2>
              <p className="text-muted-foreground">
                Probeer Servio 30 dagen gratis. Geen creditcard vereist.
              </p>
              <Button 
                size="lg" 
                className="shadow-card"
                onClick={() => window.location.href = '/signup'}
              >
                Start je gratis trial
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Pricing;