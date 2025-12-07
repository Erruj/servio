import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Nu beschikbaar voor ondernemers
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]">
            De slimme bedrijfsassistent
            <br />
            <span className="text-primary">voor ondernemers.</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Automatiseer je klantenservice, beheer je facturen en krijg realtime financiële inzichten — allemaal op één plek.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="h-12 px-8 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => navigate('/signup')}
            >
              Start Gratis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="h-12 px-8 text-base font-medium bg-background/50 backdrop-blur-sm"
            >
              <Play className="mr-2 h-4 w-4" />
              Bekijk Demo
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-6 mt-12 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              14 dagen gratis
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              Geen creditcard nodig
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              Direct aan de slag
            </span>
          </div>
        </div>

        {/* Hero mockup */}
        <div className="mt-16 md:mt-24 relative">
          <div className="absolute -inset-4 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
          <div className="relative mx-auto max-w-5xl rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="p-1">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-warning/60" />
                  <div className="w-3 h-3 rounded-full bg-success/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-muted/50 text-xs text-muted-foreground">
                    app.servio.nl
                  </div>
                </div>
              </div>
              {/* Dashboard preview */}
              <div className="aspect-[16/9] bg-gradient-to-br from-muted/30 to-muted/10 p-8">
                <div className="grid grid-cols-4 gap-4 h-full">
                  {/* Sidebar mock */}
                  <div className="col-span-1 bg-card/80 rounded-xl p-4 space-y-3">
                    <div className="h-8 w-24 bg-primary/20 rounded-md" />
                    <div className="space-y-2 mt-6">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`h-8 rounded-md ${i === 1 ? 'bg-primary/30' : 'bg-muted/50'}`} />
                      ))}
                    </div>
                  </div>
                  {/* Main content mock */}
                  <div className="col-span-3 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      {[1,2,3].map(i => (
                        <div key={i} className="bg-card/80 rounded-xl p-4 h-24">
                          <div className="h-4 w-16 bg-muted/50 rounded mb-2" />
                          <div className="h-6 w-20 bg-primary/20 rounded" />
                        </div>
                      ))}
                    </div>
                    <div className="bg-card/80 rounded-xl p-4 flex-1 h-48">
                      <div className="h-4 w-24 bg-muted/50 rounded mb-4" />
                      <div className="h-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg" />
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
