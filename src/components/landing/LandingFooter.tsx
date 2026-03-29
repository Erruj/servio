import { Link } from 'react-router-dom';

export function LandingFooter() {
  return (
    <footer className="py-16 border-t border-border/40">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-5 gap-12 mb-12">
          {/* Logo & description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-md bg-foreground flex items-center justify-center">
                <span className="text-background font-semibold text-sm">S</span>
              </div>
              <span className="font-semibold text-foreground tracking-tight">Servio</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              De slimme bedrijfsassistent voor ondernemers. Automatiseer je klantenservice en administratie.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-medium text-foreground mb-4 text-sm">Product</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Prijzen</Link></li>
              <li><Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">Over ons</Link></li>
              <li><Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">Inloggen</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-medium text-foreground mb-4 text-sm">Support</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
              <li><a href="mailto:info@getservio.co" className="text-muted-foreground hover:text-foreground transition-colors">info@getservio.co</a></li>
              <li><Link to="/signup" className="text-muted-foreground hover:text-foreground transition-colors">Account aanmaken</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-medium text-foreground mb-4 text-sm">Juridisch</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Algemene Voorwaarden</Link></li>
              <li><Link to="/cookies" className="text-muted-foreground hover:text-foreground transition-colors">Cookiebeleid</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Servio. Alle rechten voorbehouden.
          </p>
          <div className="text-sm text-muted-foreground">
            Made with ❤️ in Nederland
          </div>
        </div>
      </div>
    </footer>
  );
}