import { Button } from '@/components/ui/button';
import { ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
      {/* Ultra-subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/40 via-background to-background pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/[0.03] rounded-full blur-3xl pointer-events-none" />
      
      <div className="container mx-auto px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Social proof badge */}
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background text-sm text-muted-foreground mb-8 animate-fade-in"
            style={{ animationDelay: '0ms' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="font-medium text-foreground">500+</span> ondernemers besparen wekelijks 8+ uur
          </div>

          {/* Headline - Problem + Solution focused */}
          <h1 
            className="text-[2.75rem] md:text-6xl lg:text-[4.5rem] font-semibold tracking-[-0.02em] text-foreground mb-6 leading-[1.08] animate-fade-in"
            style={{ animationDelay: '50ms' }}
          >
            Stop met administratie.
            <br />
            <span className="text-primary">Start met ondernemen.</span>
          </h1>

          {/* Subheading - Concrete benefits */}
          <p 
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed animate-fade-in"
            style={{ animationDelay: '100ms' }}
          >
            Servio automatiseert tot 80% van je e-mails, verwerkt facturen automatisch 
            en geeft je realtime inzicht in je financiën — zodat jij kunt focussen op groeien.
          </p>

          {/* Key value props */}
          <div 
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-10 text-sm animate-fade-in"
            style={{ animationDelay: '125ms' }}
          >
            {[
              'Automatische e-mailreacties',
              'AI-factuurverwerking',
              'Financieel dashboard',
            ].map((item, i) => (
              <span key={i} className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-success" />
                {item}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in"
            style={{ animationDelay: '150ms' }}
          >
            <Button 
              size="lg" 
              className="h-12 px-8 text-[15px] font-medium rounded-lg transition-smooth glow-primary hover:glow"
              onClick={() => navigate('/signup')}
            >
              Start 14 dagen gratis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="h-12 px-8 text-[15px] font-medium rounded-lg"
              onClick={() => navigate('/features')}
            >
              <Play className="mr-2 h-4 w-4" />
              Ontdek alle features
            </Button>
          </div>

          {/* Trust indicators */}
          <div 
            className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-muted-foreground animate-fade-in"
            style={{ animationDelay: '200ms' }}
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Geen creditcard nodig
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              In 2 minuten actief
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Annuleren wanneer je wilt
            </span>
          </div>
        </div>

        {/* Hero mockup */}
        <div 
          className="mt-20 md:mt-28 relative animate-fade-in"
          style={{ animationDelay: '250ms' }}
        >
          <div className="absolute -bottom-1 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
          
          <div className="relative mx-auto max-w-5xl rounded-xl border border-border/60 bg-card shadow-xl-soft overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/30">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-border" />
                <div className="w-2.5 h-2.5 rounded-full bg-border" />
                <div className="w-2.5 h-2.5 rounded-full bg-border" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-8 py-1 rounded-md bg-muted text-xs text-muted-foreground font-medium">
                  app.getservio.co
                </div>
              </div>
              <div className="w-16" />
            </div>
            
            {/* Dashboard preview */}
            <div className="aspect-[16/10] bg-muted/20 p-6 md:p-8">
              <div className="grid grid-cols-5 gap-4 h-full">
                {/* Sidebar mock */}
                <div className="col-span-1 bg-card rounded-lg p-4 shadow-subtle border border-border/30">
                  <div className="h-6 w-16 bg-primary/20 rounded mb-6" />
                  <div className="space-y-2">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`h-7 rounded ${i === 1 ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'}`} />
                    ))}
                  </div>
                </div>
                
                {/* Main content mock */}
                <div className="col-span-4 space-y-4">
                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Tijd bespaard', value: '12 uur/week' },
                      { label: 'Afgehandelde mails', value: '156' },
                      { label: 'Facturen verwerkt', value: '24' },
                      { label: 'Omzet inzicht', value: '€12.450' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-card rounded-lg p-4 shadow-subtle border border-border/30">
                        <div className="text-[10px] text-muted-foreground mb-1">{stat.label}</div>
                        <div className="text-sm font-semibold text-foreground">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Chart area */}
                  <div className="bg-card rounded-lg p-4 shadow-subtle border border-border/30 flex-1 h-32 md:h-44">
                    <div className="h-3 w-20 bg-muted rounded mb-4" />
                    <div className="h-full flex items-end gap-2 pb-4">
                      {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-primary/20 rounded-sm transition-all duration-300"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Bottom row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card rounded-lg p-4 shadow-subtle border border-border/30">
                      <div className="h-3 w-16 bg-muted rounded mb-3" />
                      <div className="space-y-2">
                        {[1,2,3].map(i => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-muted/50" />
                            <div className="h-2 flex-1 bg-muted/30 rounded" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-card rounded-lg p-4 shadow-subtle border border-border/30">
                      <div className="h-3 w-16 bg-muted rounded mb-3" />
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-lg bg-primary/10" />
                        <div className="space-y-2 flex-1">
                          <div className="h-2 w-full bg-muted/30 rounded" />
                          <div className="h-2 w-3/4 bg-muted/30 rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
