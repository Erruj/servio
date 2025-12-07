import { Clock, FileCheck, Eye, Headphones, Sparkles, Wallet } from 'lucide-react';

const benefits = [
  {
    icon: Clock,
    title: 'Tijdsbesparing',
    description: 'Bespaar uren per week op repetitieve taken.',
  },
  {
    icon: FileCheck,
    title: 'Minder administratie',
    description: 'Automatische verwerking van facturen en bonnetjes.',
  },
  {
    icon: Eye,
    title: 'Overzicht & duidelijkheid',
    description: 'Altijd inzicht in je financiële situatie.',
  },
  {
    icon: Headphones,
    title: 'Professionele klantenservice',
    description: 'AI-ondersteunde antwoorden van hoge kwaliteit.',
  },
  {
    icon: Sparkles,
    title: 'Betrouwbare AI',
    description: 'Slimme suggesties die je kunt vertrouwen.',
  },
  {
    icon: Wallet,
    title: "Betaalbaar voor ZZP'ers",
    description: 'Professionele tools voor een eerlijke prijs.',
  },
];

export function BenefitsSection() {
  return (
    <section className="py-24 md:py-32 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Voordelen voor ondernemers
          </h2>
          <p className="text-lg text-muted-foreground">
            Waarom duizenden ondernemers kiezen voor Servio.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="flex items-start gap-4"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <benefit.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
