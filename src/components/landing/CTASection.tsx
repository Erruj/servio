import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border border-primary/20 p-10 md:p-16 text-center overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.02em] text-foreground mb-6">
                Klaar om tijd terug te winnen?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Sluit je aan bij 500+ ondernemers die hun administratie hebben geautomatiseerd 
                en nu focussen op wat écht telt.
              </p>
              
              {/* Trust points */}
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-10 text-sm">
                {[
                  '14 dagen gratis',
                  'Geen creditcard nodig',
                  'Direct aan de slag',
                ].map((item, i) => (
                  <span key={i} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    {item}
                  </span>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button 
                  size="lg" 
                  className="h-14 px-10 text-base font-medium rounded-xl transition-smooth glow-primary hover:glow"
                  onClick={() => navigate('/signup')}
                >
                  Start mijn gratis proefperiode
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
              
              <p className="mt-6 text-sm text-muted-foreground">
                Of <button onClick={() => navigate('/features')} className="text-primary hover:underline font-medium">bekijk eerst alle features</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
