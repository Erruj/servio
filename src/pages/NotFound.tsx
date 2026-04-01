import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search, HelpCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>Pagina niet gevonden | Servio</title>
        <meta name="description" content="De pagina die je zoekt bestaat niet of is verplaatst." />
        <meta name="robots" content="noindex" />
      </Helmet>
      
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <div className="text-8xl font-bold text-primary/20 mb-2 select-none">404</div>
          <h1 className="text-3xl font-bold text-foreground mb-3">Pagina niet gevonden</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            De pagina <code className="bg-muted px-2 py-0.5 rounded text-sm font-mono">{location.pathname}</code> bestaat niet of is verplaatst.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Button asChild size="lg">
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Naar home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" onClick={() => window.history.back()}>
              <button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ga terug
              </button>
            </Button>
          </div>

          <div className="border-t border-border pt-8">
            <p className="text-sm text-muted-foreground mb-4">Misschien zoek je een van deze pagina's:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { to: '/app', label: 'Inbox' },
                { to: '/dashboard', label: 'Dashboard' },
                { to: '/pricing', label: 'Prijzen' },
                { to: '/contact', label: 'Contact' },
              ].map(link => (
                <Button key={link.to} asChild variant="ghost" size="sm">
                  <Link to={link.to}>{link.label}</Link>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
