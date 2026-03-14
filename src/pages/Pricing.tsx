import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown, Loader2, Clock, Sparkles } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useSubscription, SUBSCRIPTION_TIERS } from '@/hooks/useSubscription';
import { toast } from 'sonner';

const Pricing = () => {
  const { user, signOut } = useAuth();
  const { subscriptionStatus, createCheckoutSession, getCurrentTier, openCustomerPortal, isLoading } = useSubscription();

  const plans = [
    {
      name: 'Starter',
      tier: 'starter',
      price: '€9,99',
      period: '/maand',
      description: 'Perfect voor freelancers en starters',
      icon: <Star className="h-7 w-7" />,
      features: SUBSCRIPTION_TIERS.starter.features,
      buttonText: 'Start Starter',
      variant: 'outline' as const,
      popular: false,
      productId: SUBSCRIPTION_TIERS.starter.product_id,
      highlight: 'Ideaal om te beginnen',
    },
    {
      name: 'Pro',
      tier: 'pro',
      price: '€29,99',
      period: '/maand',
      description: 'Voor groeiende bedrijven',
      icon: <Zap className="h-7 w-7" />,
      features: SUBSCRIPTION_TIERS.pro.features,
      buttonText: 'Kies Pro',
      variant: 'default' as const,
      popular: true,
      productId: SUBSCRIPTION_TIERS.pro.product_id,
      highlight: 'Meeste waarde',
    },
    {
      name: 'Business',
      tier: 'business',
      price: '€79,99',
      period: '/maand',
      description: 'Voor teams en grote organisaties',
      icon: <Crown className="h-7 w-7" />,
      features: SUBSCRIPTION_TIERS.business.features,
      buttonText: 'Kies Business',
      variant: 'outline' as const,
      popular: false,
      productId: SUBSCRIPTION_TIERS.business.product_id,
      highlight: 'Onbeperkte kracht',
    }
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

  const isCurrentPlan = (productId: string) => {
    return subscriptionStatus?.product_id === productId;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} onLogout={signOut} />
      
      <div className="flex-1 flex">
        <Sidebar />
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 space-y-6 md:space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Servio Pakketten</h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Kies het Servio-pakket dat bij jouw bedrijf past
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                <Badge variant="secondary" className="bg-success/10 text-success border-success/20 px-3 py-1">
                  <Clock className="h-3 w-3 mr-1" />
                  14 dagen gratis trial
                </Badge>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
                  <Check className="h-3 w-3 mr-1" />
                  Direct opzegbaar
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <Card 
                  key={index}
                  className={`relative shadow-card hover:shadow-elevated transition-all duration-300 flex flex-col ${
                    plan.popular 
                      ? 'border-2 border-primary ring-4 ring-primary/10 scale-[1.02] md:scale-105' 
                      : 'border-border'
                  } ${
                    isCurrentPlan(plan.productId) ? 'ring-2 ring-success bg-success/5' : ''
                  }`}
                >
                  {/* Popular Badge - Enhanced */}
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg px-4 py-1.5 text-sm font-semibold animate-pulse">
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        Meest Populair
                      </Badge>
                    </div>
                  )}
                  
                  {/* Trial Badge - per card */}
                  <div className="absolute -top-3 right-4">
                    <Badge variant="outline" className="bg-background border-success/30 text-success text-xs px-2 py-0.5">
                      <Clock className="h-3 w-3 mr-1" />
                      14 dagen gratis
                    </Badge>
                  </div>
                  
                  {/* Current Plan Badge */}
                  {isCurrentPlan(plan.productId) && (
                    <div className="absolute -top-3 left-4">
                      <Badge className="bg-success text-white shadow-card text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Jouw Pakket
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className={`text-center space-y-4 pb-4 ${plan.popular ? 'pt-8' : 'pt-6'}`}>
                    <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center shadow-card ${
                      plan.popular 
                        ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground' 
                        : 'bg-secondary text-foreground'
                    }`}>
                      {plan.icon}
                    </div>
                    
                    <div className="space-y-1">
                      <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                      <p className="text-xs text-primary font-medium">{plan.highlight}</p>
                    </div>
                    
                    <div className="space-y-1 pt-2">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                        <span className="text-muted-foreground text-sm">{plan.period}</span>
                      </div>
                    </div>
                    
                    <Button 
                      variant={isCurrentPlan(plan.productId) ? 'outline' : plan.variant}
                      size="lg" 
                      className={`w-full shadow-card h-12 font-semibold ${
                        plan.popular && !isCurrentPlan(plan.productId) 
                          ? 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground' 
                          : ''
                      }`}
                      onClick={() => handleSubscribe(plan.priceId, plan.name)}
                      disabled={isCurrentPlan(plan.productId) || isLoading}
                    >
                      {isLoading ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Laden...</>
                      ) : isCurrentPlan(plan.productId) ? (
                        <><Check className="w-4 h-4 mr-2" /> Actief Abonnement</>
                      ) : (
                        plan.buttonText
                      )}
                    </Button>
                  </CardHeader>
                  
                  <CardContent className="flex-1 pt-0">
                    <div className="border-t border-border pt-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        Inbegrepen:
                      </p>
                      <ul className="space-y-2.5">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start gap-3">
                            <div className="mt-0.5 flex-shrink-0">
                              <Check className="h-4 w-4 text-success" />
                            </div>
                            <span className="text-sm text-foreground leading-tight">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* FAQ Section */}
            <div className="max-w-4xl mx-auto space-y-6 pt-4">
              <h2 className="text-2xl font-bold text-center text-foreground">Veelgestelde Vragen</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Card key={index} className="shadow-subtle hover:shadow-card transition-shadow">
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center space-y-4 py-6">
              <h2 className="text-2xl font-bold text-foreground">Klaar om te starten?</h2>
              <p className="text-muted-foreground">
                Start vandaag nog met 14 dagen gratis trial. Geen creditcard vereist.
              </p>
              {!user ? (
                <Button 
                  size="lg" 
                  className="shadow-card h-12 px-8"
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