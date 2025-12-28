const testimonials = [
  {
    quote: "Servio heeft mijn administratie volledig geautomatiseerd. Ik bespaar nu minstens 5 uur per week.",
    author: 'Sophie van der Berg',
    role: 'Freelance Designer',
    initials: 'SB',
  },
  {
    quote: "De AI-antwoorden voor klantenservice zijn verrassend goed. Mijn klanten merken het verschil niet.",
    author: 'Mark Janssen',
    role: 'E-commerce Ondernemer',
    initials: 'MJ',
  },
  {
    quote: "Eindelijk een tool die speciaal is gemaakt voor Nederlandse ZZP'ers. BTW-berekening werkt perfect.",
    author: 'Lisa de Vries',
    role: 'Marketing Consultant',
    initials: 'LV',
  },
  {
    quote: "Het financiële dashboard geeft me in één oogopslag inzicht in hoe mijn bedrijf ervoor staat.",
    author: 'Thomas Bakker',
    role: 'IT Consultant',
    initials: 'TB',
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-6">
        <div className="max-w-xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-foreground mb-4">
            Vertrouwd door ondernemers
          </h2>
          <p className="text-muted-foreground">
            Ontdek waarom ondernemers kiezen voor Servio.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="p-6 rounded-xl bg-card border border-border/40 hover:border-border transition-colors duration-300"
            >
              <p className="text-foreground mb-5 leading-relaxed text-[15px]">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium text-xs">
                  {testimonial.initials}
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
