import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export function LandingHeader() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-background/80 backdrop-blur-lg border-b border-border/50 shadow-sm' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">S</span>
            </div>
            <span className="font-semibold text-lg text-foreground">Servio</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Prijzen
            </a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </a>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="text-sm"
            >
              Inloggen
            </Button>
            <Button 
              onClick={() => navigate('/signup')}
              className="text-sm"
            >
              Start Gratis
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <nav className="flex flex-col gap-4">
              <a 
                href="#features" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#pricing" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Prijzen
              </a>
              <a 
                href="#faq" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                FAQ
              </a>
              <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/')}
                  className="w-full"
                >
                  Inloggen
                </Button>
                <Button 
                  onClick={() => navigate('/signup')}
                  className="w-full"
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
