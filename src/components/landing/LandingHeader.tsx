import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import servioLogo from '@/assets/servio-logo-full.png';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function LandingHeader() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const prefix = i18n.language?.startsWith('en') ? '/en' : '';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: t('marketing.nav.features'), href: `${prefix}/features` },
    { label: t('marketing.nav.pricing'), href: `${prefix}/pricing` },
    { label: t('marketing.nav.blog'), href: `${prefix}/blog` },
    { label: t('marketing.nav.about'), href: `${prefix}/about` },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-smooth ${
        isScrolled ? 'glass border-b border-border/40' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link to={prefix || '/'} className="flex items-center group" aria-label="Servio">
            <img src={servioLogo} alt="Servio AI Business Assistant logo" className="h-9 md:h-10 w-auto transition-transform duration-300 group-hover:scale-105" />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-md hover:bg-muted/50"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <LanguageSwitcher variant="marketing" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/login')}
              className="text-sm text-muted-foreground hover:text-foreground h-9 px-4"
            >
              {t('marketing.nav.login')}
            </Button>
            <Button size="sm" onClick={() => navigate('/signup')} className="text-sm h-9 px-4 rounded-lg">
              {t('marketing.nav.startFree')}
            </Button>
          </div>

          <button
            className="md:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden -mx-6 px-6 py-4 border-t border-border bg-background shadow-elevated">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="px-3 py-3 text-base font-medium text-foreground hover:bg-muted rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-border">
                <div className="px-3"><LanguageSwitcher variant="marketing" /></div>
                <Button variant="ghost" onClick={() => navigate('/login')} className="justify-start h-11 text-base">
                  {t('marketing.nav.login')}
                </Button>
                <Button onClick={() => navigate('/signup')} className="h-11 text-base">
                  {t('marketing.nav.startFree')}
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
