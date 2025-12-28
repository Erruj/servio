const products = [
  {
    title: 'Inbox met AI',
    description: 'Automatische reply-suggesties, sentiment analyse en slimme categorisering.',
  },
  {
    title: 'Financieel Dashboard',
    description: 'Real-time inzicht in inkomsten, uitgaven en winstmarges.',
  },
  {
    title: 'Factuurverwerking',
    description: 'Upload facturen en laat AI de details automatisch extraheren.',
  },
];

export function ProductSection() {
  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-6">
        <div className="max-w-xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-foreground mb-4">
            Gebouwd voor productiviteit
          </h2>
          <p className="text-muted-foreground">
            Krachtige tools die samenwerken om je bedrijf te stroomlijnen.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {products.map((product, index) => (
            <div 
              key={index}
              className="group rounded-xl border border-border/40 overflow-hidden bg-card hover:border-border hover:shadow-elevated transition-all duration-500"
            >
              {/* Product mockup - Clean and abstract */}
              <div className="aspect-[4/3] bg-muted/30 p-5 relative overflow-hidden">
                {/* Subtle pattern */}
                <div className="absolute inset-0 opacity-50">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)',
                    backgroundSize: '24px 24px'
                  }} />
                </div>
                
                {/* Mockup card */}
                <div className="relative h-full rounded-lg bg-card border border-border/60 p-4 shadow-card transform group-hover:translate-y-[-2px] transition-transform duration-500">
                  {/* Header bar */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-primary/40" />
                    <div className="h-2 w-12 bg-muted rounded" />
                  </div>
                  
                  {/* Content lines */}
                  <div className="space-y-2 mb-4">
                    <div className="h-1.5 w-full bg-muted/60 rounded" />
                    <div className="h-1.5 w-4/5 bg-muted/60 rounded" />
                    <div className="h-1.5 w-3/5 bg-muted/60 rounded" />
                  </div>
                  
                  {/* Bottom element */}
                  <div className="absolute bottom-3 right-3 left-3">
                    <div className="h-8 rounded bg-primary/10 flex items-center justify-center">
                      <div className="w-8 h-1.5 bg-primary/30 rounded" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Product info */}
              <div className="p-5">
                <h3 className="text-[15px] font-medium text-foreground mb-1.5">
                  {product.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
