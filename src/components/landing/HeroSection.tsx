import { Button } from '@/components/ui/button';
import { ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroVideo from '@/assets/hero-product-video.mp4.asset.json';

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden" aria-label="Servio AI bedrijfsassistent introductie">
      {/* Premium gradient background with colored glows */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/40 via-background to-background pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/[0.06] rounded-full blur-3xl pointer-events-none animate-pulse-subtle" />
      <div className="absolute top-40 -left-20 w-[500px] h-[500px] bg-accent/[0.05] rounded-full blur-3xl pointer-events-none animate-float" />
      <div className="absolute top-20 -right-20 w-[450px] h-[450px] bg-primary/[0.04] rounded-full blur-3xl pointer-events-none" />

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
            
            {/* Live product motion video */}
            <div className="aspect-[16/10] bg-muted/20 relative overflow-hidden">
              <video
                src={heroVideo.url}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Subtle premium color wash */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/[0.06] via-transparent to-accent/[0.06] pointer-events-none" />
              <div className="absolute inset-0 ring-1 ring-inset ring-border/40 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
