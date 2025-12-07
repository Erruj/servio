import { Mail, BarChart3, FileText, Bot } from 'lucide-react';

const features = [
  {
    icon: Mail,
    title: 'Slimme Klantenservice',
    description: 'AI beantwoordt e-mails, maakt drafts en geeft reply-suggesties. Bespaar uren per week.',
  },
  {
    icon: BarChart3,
    title: 'Financieel Overzicht',
    description: 'Dashboard met inkomsten, uitgaven, winst, trends en AI-inzichten. Altijd up-to-date.',
  },
  {
    icon: FileText,
    title: 'Facturen & Bonnetjes',
    description: 'Automatische herkenning van bedragen, btw, leveranciers en categorieën.',
  },
  {
    icon: Bot,
    title: 'AI Boekhoudassistent',
    description: 'Stel vragen over je financiën: omzet, btw-reservering, topuitgaven en meer.',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 md:py-32 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Alles wat je nodig hebt
          </h2>
          <p className="text-lg text-muted-foreground">
            Eén platform voor klantenservice, administratie en financieel inzicht.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              {/* Subtle gradient on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
