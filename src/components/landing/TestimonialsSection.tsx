const testimonials = [
  {
    quote: "Servio heeft mijn administratie volledig geautomatiseerd. Ik bespaar nu minstens 5 uur per week.",
    author: 'Sophie van der Berg',
    role: 'Freelance Designer',
    avatar: 'SB',
  },
  {
    quote: "De AI-antwoorden voor klantenservice zijn verrassend goed. Mijn klanten merken het verschil niet.",
    author: 'Mark Janssen',
    role: 'E-commerce Ondernemer',
    avatar: 'MJ',
  },
  {
    quote: "Eindelijk een tool die speciaal is gemaakt voor Nederlandse ZZP'ers. BTW-berekening werkt perfect.",
    author: 'Lisa de Vries',
    role: 'Marketing Consultant',
    avatar: 'LV',
  },
  {
    quote: "Het financiële dashboard geeft me in één oogopslag inzicht in hoe mijn bedrijf ervoor staat.",
    author: 'Thomas Bakker',
    role: 'IT Consultant',
    avatar: 'TB',
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Vertrouwd door ondernemers
          </h2>
          <p className="text-lg text-muted-foreground">
            Ontdek waarom ondernemers kiezen voor Servio.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="p-6 rounded-2xl bg-card border border-border/50"
            >
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">
                    {testimonial.author}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
