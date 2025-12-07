const products = [
  {
    title: 'Inbox met AI',
    description: 'Automatische reply-suggesties, sentiment analyse en slimme categorisering.',
    gradient: 'from-blue-500/20 to-purple-500/20',
  },
  {
    title: 'Financieel Dashboard',
    description: 'Real-time inzicht in inkomsten, uitgaven en winstmarges.',
    gradient: 'from-emerald-500/20 to-cyan-500/20',
  },
  {
    title: 'Factuurverwerking',
    description: 'Upload facturen en laat AI de details automatisch extraheren.',
    gradient: 'from-orange-500/20 to-rose-500/20',
  },
];

export function ProductSection() {
  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Gebouwd voor productiviteit
          </h2>
          <p className="text-lg text-muted-foreground">
            Krachtige tools die samenwerken om je bedrijf te stroomlijnen.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {products.map((product, index) => (
            <div 
              key={index}
              className="group rounded-2xl border border-border/50 overflow-hidden bg-card hover:shadow-xl transition-all duration-500"
            >
              {/* Product mockup */}
              <div className={`aspect-[4/3] bg-gradient-to-br ${product.gradient} p-6 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)]" />
                <div className="relative h-full rounded-lg bg-card/90 backdrop-blur-sm border border-border/50 p-4 shadow-lg transform group-hover:scale-[1.02] transition-transform duration-500">
                  <div className="h-3 w-16 bg-muted rounded mb-3" />
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-muted/50 rounded" />
                    <div className="h-2 w-3/4 bg-muted/50 rounded" />
                    <div className="h-2 w-1/2 bg-muted/50 rounded" />
                  </div>
                  <div className="absolute bottom-4 right-4 w-12 h-12 rounded-lg bg-primary/20" />
                </div>
              </div>
              
              {/* Product info */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {product.title}
                </h3>
                <p className="text-sm text-muted-foreground">
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
