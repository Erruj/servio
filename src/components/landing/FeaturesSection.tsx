import { Mail, BarChart3, FileText, Bot, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: Mail,
    title: 'Bespaar 8+ uur per week op e-mail',
    description: 'AI beantwoordt 80% van je mails automatisch. Jij keurt alleen nog goed.',
    result: 'Meer tijd voor klanten',
  },
  {
    icon: BarChart3,
    title: 'Altijd weten waar je staat',
    description: 'Realtime dashboard met omzet, uitgaven en winst. Geen verrassingen meer.',
    result: 'Financieel overzicht 24/7',
  },
  {
    icon: FileText,
    title: 'Facturen verwerkt in seconden',
    description: 'Upload een factuur, AI herkent alles: bedragen, btw, leverancier, categorie.',
    result: 'Geen handmatig invoeren',
  },
  {
    icon: Bot,
    title: 'Stel vragen aan je boekhouding',
    description: '"Hoeveel heb ik dit kwartaal aan software uitgegeven?" Direct antwoord.',
    result: 'Inzicht zonder zoeken',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 md:py-32 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center mb-16 animate-fade-in-up">
          <span className="text-sm font-medium text-primary mb-4 block">Wat Servio oplevert</span>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-foreground mb-4">
            Minder werk. Meer resultaat.
          </h2>
          <p className="text-lg text-muted-foreground">
            Elke feature is ontworpen om jou tijd terug te geven en overzicht te creëren.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative p-8 rounded-xl bg-card border border-border/40 hover:border-border hover:shadow-elevated transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${(index + 1) * 100}ms` }}
            >
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {feature.description}
                  </p>
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all duration-300">
                    <ArrowRight className="w-4 h-4" />
                    {feature.result}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}