import { Link } from 'react-router-dom';

export function LandingFooter() {
  return (
    <footer className="py-16 border-t border-border/50">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Logo & description */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">S</span>
              </div>
              <span className="font-semibold text-lg text-foreground">Servio</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              De slimme bedrijfsassistent voor ondernemers. Automatiseer je klantenservice en administratie.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link></li>
              <li><Link to="/#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Prijzen</Link></li>
              <li><Link to="/signup" className="text-muted-foreground hover:text-foreground transition-colors">Aanmelden</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Help Center</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Status</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Juridisch</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Algemene Voorwaarden</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Cookiebeleid</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Servio. Alle rechten voorbehouden.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>Made with ❤️ in Nederland</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
