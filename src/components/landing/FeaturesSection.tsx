import { Mail, BarChart3, FileText, Bot, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: Mail,
    title: 'Bespaar 8+ uur per week op e-mail',
    description: 'AI beantwoordt 80% van je mails automatisch. Jij keurt alleen nog goed.',
    result: 'Meer tijd voor klanten',
    tint: 'from-primary/10 to-primary/0',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  {
    icon: BarChart3,
    title: 'Altijd weten waar je staat',
    description: 'Realtime dashboard met omzet, uitgaven en winst. Geen verrassingen meer.',
    result: 'Financieel overzicht 24/7',
    tint: 'from-accent/10 to-accent/0',
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
  },
  {
    icon: FileText,
    title: 'Facturen verwerkt in seconden',
    description: 'Upload een factuur, AI herkent alles: bedragen, btw, leverancier, categorie.',
    result: 'Geen handmatig invoeren',
    tint: 'from-warning/10 to-warning/0',
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
  },
  {
    icon: Bot,
    title: 'Stel vragen aan je boekhouding',
    description: '"Hoeveel heb ik dit kwartaal aan software uitgegeven?" Direct antwoord.',
    result: 'Inzicht zonder zoeken',
    tint: 'from-success/10 to-success/0',
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 md:py-32 bg-muted/30 overflow-hidden" aria-label="Servio features en voordelen">
      {/* Decorative color glows */}
      <div className="absolute -top-32 -left-32 w-[400px] h-[400px] bg-primary/[0.05] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-20 w-[450px] h-[450px] bg-accent/[0.05] rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-6 relative">
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
              className="group relative p-8 rounded-xl bg-card border border-border/40 hover:border-border hover:shadow-elevated transition-all duration-300 animate-fade-in-up overflow-hidden"
              style={{ animationDelay: `${(index + 1) * 100}ms` }}
            >
              {/* Subtle colored hover wash */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.tint} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
              <div className="relative flex items-start gap-5">
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center group-hover:scale-110 transition-all duration-300`}>
                  <feature.icon className={`w-6 h-6 ${feature.iconColor}`} strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {feature.description}
                  </p>
                  <div className={`inline-flex items-center gap-2 text-sm font-medium ${feature.iconColor} group-hover:gap-3 transition-all duration-300`}>
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