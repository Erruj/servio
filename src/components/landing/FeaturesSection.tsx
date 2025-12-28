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
        <div className="max-w-xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-foreground mb-4">
            Alles wat je nodig hebt
          </h2>
          <p className="text-muted-foreground">
            Eén platform voor klantenservice, administratie en financieel inzicht.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative p-6 rounded-xl bg-card border border-border/40 hover:border-border hover:shadow-elevated transition-all duration-300"
            >
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors duration-300">
                <feature.icon className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors duration-300" strokeWidth={1.5} />
              </div>
              <h3 className="text-[15px] font-medium text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
