import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useSubscription, SUBSCRIPTION_TIERS } from '@/hooks/useSubscription';
import { toast } from 'sonner';

const Pricing = () => {
  const { user, signOut } = useAuth();
  const { subscriptionStatus, createCheckoutSession, getCurrentTier, openCustomerPortal, isLoading } = useSubscription();

  const plans = [
    {
      name: 'Starter',
      price: '€9,99',
      period: '/maand',
      description: 'Perfect voor freelancers',
      icon: <Star className="h-6 w-6" />,
      features: SUBSCRIPTION_TIERS.starter.features,
      buttonText: 'Start Starter',
      variant: 'outline' as const,
      popular: false,
      priceId: SUBSCRIPTION_TIERS.starter.price_id,
      productId: SUBSCRIPTION_TIERS.starter.product_id,
    },
    {
      name: 'Pro',
      price: '€29,99',
      period: '/maand',
      description: 'Voor groeiende bedrijven',
      icon: <Zap className="h-6 w-6" />,
      features: SUBSCRIPTION_TIERS.pro.features,
      buttonText: 'Kies Pro',
      variant: 'default' as const,
      popular: true,
      priceId: SUBSCRIPTION_TIERS.pro.price_id,
      productId: SUBSCRIPTION_TIERS.pro.product_id,
    },
    {
      name: 'Business',
      price: '€79,99',
      period: '/maand',
      description: 'Voor grote organisaties',
      icon: <Crown className="h-6 w-6" />,
      features: SUBSCRIPTION_TIERS.business.features,
      buttonText: 'Kies Business',
      variant: 'outline' as const,
      popular: false,
      priceId: SUBSCRIPTION_TIERS.business.price_id,
      productId: SUBSCRIPTION_TIERS.business.product_id,
    }
  ];

  const handleSubscribe = async (priceId: string, planName: string) => {
    if (!user) {
      toast.error('Log eerst in om te abonneren');
      window.location.href = '/auth';
      return;
    }
    
    toast.info(`Checkout sessie wordt geopend voor ${planName}...`);
    await createCheckoutSession(priceId);
  };

  const isCurrentPlan = (productId: string) => {
    return subscriptionStatus?.product_id === productId;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} onLogout={signOut} />
      
      <div className="flex-1 flex">
        <Sidebar />
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-foreground">💰 Servio Pakketten</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Kies het Servio-pakket dat bij je past. Start met 14 dagen gratis trial.
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                  ✓ 14 dagen gratis trial
                </Badge>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  ✓ Direct opzegbaar
                </Badge>
              </div>
              {subscriptionStatus?.subscription_status === 'active' && (
                <div className="mt-4">
                  <Button onClick={openCustomerPortal} variant="outline">
                    Beheer Abonnement
                  </Button>
                </div>
              )}
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <Card 
                  key={index}
                  className={`relative shadow-card hover:shadow-elevated transition-all duration-200 ${
                    plan.popular ? 'border-primary/50 ring-1 ring-primary/20' : ''
                  } ${
                    isCurrentPlan(plan.productId) ? 'ring-2 ring-success bg-success/5' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground shadow-card">
                        🌟 Meest Populair
                      </Badge>
                    </div>
                  )}
                  {isCurrentPlan(plan.productId) && (
                    <div className="absolute -top-3 right-4">
                      <Badge className="bg-success text-white shadow-card">
                        ✓ Jouw Pakket
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
                      variant={isCurrentPlan(plan.productId) ? 'outline' : plan.variant}
                      size="lg" 
                      className={`w-full shadow-card ${
                        plan.popular && !isCurrentPlan(plan.productId) ? 'bg-primary hover:bg-primary/90' : ''
                      }`}
                      onClick={() => handleSubscribe(plan.priceId, plan.name)}
                      disabled={isCurrentPlan(plan.productId) || isLoading}
                    >
                      {isLoading ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Laden...</>
                      ) : isCurrentPlan(plan.productId) ? (
                        '✓ Actief Abonnement'
                      ) : (
                        plan.buttonText
                      )}
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
                    q: 'Hoe werkt de gratis trial?',
                    a: 'Je krijgt 14 dagen gratis toegang tot alle functies. Geen creditcard nodig tijdens de trial.'
                  },
                  {
                    q: 'Kan ik upgraden of downgraden?',
                    a: 'Ja, je kunt op elk moment van plan wisselen via het abonnementsbeheer. Wijzigingen gaan direct in.'
                  },
                  {
                    q: 'Kan ik direct opzeggen?',
                    a: 'Ja, je kunt je abonnement op elk moment opzeggen. Er zijn geen verplichte looptijden.'
                  },
                  {
                    q: 'Welke betaalmethodes accepteren jullie?',
                    a: 'We accepteren alle gangbare betaalmethodes via Stripe: creditcards, iDEAL, Bancontact en meer.'
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
                Start vandaag nog met 14 dagen gratis trial. Geen creditcard vereist.
              </p>
              {!user ? (
                <Button 
                  size="lg" 
                  className="shadow-card"
                  onClick={() => window.location.href = '/auth'}
                >
                  Start je gratis trial
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Kies hierboven een pakket om te starten
                </p>
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