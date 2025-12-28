import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.02em] text-foreground mb-6">
            Begin vandaag met Servio
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Ontdek hoe Servio je kan helpen met je klantenservice, administratie en financieel overzicht. 
            14 dagen gratis, geen creditcard nodig.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="h-12 px-8 text-base font-medium rounded-xl transition-smooth glow-primary hover:glow"
              onClick={() => navigate('/signup')}
            >
              Start Gratis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="lg" 
              className="h-12 px-8 text-base font-medium text-muted-foreground hover:text-foreground rounded-xl"
              onClick={() => navigate('/features')}
            >
              Bekijk alle features
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
