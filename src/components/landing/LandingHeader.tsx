import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export function LandingHeader() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-smooth ${
        isScrolled 
          ? 'glass border-b border-border/40' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Clean and simple */}
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="Servio - Terug naar homepage">
            <div className="w-7 h-7 rounded-md bg-foreground flex items-center justify-center transition-transform duration-300 group-hover:scale-105" aria-hidden="true">
              <span className="text-background font-semibold text-sm">S</span>
            </div>
            <span className="font-semibold text-foreground tracking-tight">Servio</span>
          </Link>

          {/* Desktop Nav - Minimal */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: 'Features', href: '/features' },
              { label: 'Prijzen', href: '/pricing' },
              { label: 'Over ons', href: '/about' },
            ].map((item) => (
              <Link 
                key={item.href}
                to={item.href} 
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-md hover:bg-muted/50"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/login')}
              className="text-sm text-muted-foreground hover:text-foreground h-9 px-4"
            >
              Inloggen
            </Button>
            <Button 
              size="sm"
              onClick={() => navigate('/signup')}
              className="text-sm h-9 px-4 rounded-lg"
            >
              Start Gratis
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/40 animate-fade-in">
            <nav className="flex flex-col gap-1">
              {[
                { label: 'Features', href: '/features' },
                { label: 'Prijzen', href: '/pricing' },
                { label: 'Over ons', href: '/about' },
              ].map((item) => (
                <Link 
                  key={item.href}
                  to={item.href} 
                  className="px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-border/40">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/login')}
                  className="justify-start h-10"
                >
                  Inloggen
                </Button>
                <Button 
                  onClick={() => navigate('/signup')}
                  className="h-10"
                >
                  Start Gratis
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
