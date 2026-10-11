import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Cookie } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const COPY = {
  nl: { body: 'Servio gebruikt essentiële cookies voor de werking van de app en optionele analytics-cookies om de ervaring te verbeteren. Lees ons', privacy: 'privacybeleid', and: 'en', cookies: 'cookiebeleid', more: 'voor meer informatie.', accept: 'Accepteren', essential: 'Alleen essentieel', close: 'Sluiten' },
  en: { body: 'Servio uses essential cookies to run the app and optional analytics cookies to improve your experience. Read our', privacy: 'privacy policy', and: 'and', cookies: 'cookie policy', more: 'for more information.', accept: 'Accept', essential: 'Essential only', close: 'Close' },
  de: { body: 'Servio verwendet notwendige Cookies für den Betrieb der App und optionale Analyse-Cookies zur Verbesserung. Lesen Sie unsere', privacy: 'Datenschutzerklärung', and: 'und', cookies: 'Cookie-Richtlinie', more: 'für weitere Informationen.', accept: 'Akzeptieren', essential: 'Nur notwendige', close: 'Schließen' },
  fr: { body: 'Servio utilise des cookies essentiels au fonctionnement de l’app et des cookies d’analyse facultatifs pour améliorer l’expérience. Consultez notre', privacy: 'politique de confidentialité', and: 'et', cookies: 'politique de cookies', more: 'pour en savoir plus.', accept: 'Accepter', essential: 'Essentiels uniquement', close: 'Fermer' },
  es: { body: 'Servio usa cookies esenciales para el funcionamiento de la app y cookies analíticas opcionales para mejorar la experiencia. Lee nuestra', privacy: 'política de privacidad', and: 'y', cookies: 'política de cookies', more: 'para más información.', accept: 'Aceptar', essential: 'Solo esenciales', close: 'Cerrar' },
} as const;

const COOKIE_CONSENT_KEY = 'servio-cookie-consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const { i18n } = useTranslation();
  const c = COPY[(i18n.language || 'nl').slice(0, 2) as keyof typeof COPY] ?? COPY.nl;

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay so it doesn't flash on load
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ accepted: true, date: new Date().toISOString() }));
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ accepted: false, date: new Date().toISOString() }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="max-w-2xl mx-auto shadow-elevated border-border">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Cookie className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-foreground text-sm">Cookies & Privacy</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {c.body}{' '}
                  <a href="/privacy" className="text-primary underline">{c.privacy}</a>
                  {' '}{c.and}{' '}
                  <a href="/cookies" className="text-primary underline">{c.cookies}</a> {c.more}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleAccept}>{c.accept}</Button>
                <Button size="sm" variant="outline" onClick={handleDecline}>{c.essential}</Button>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-11 w-11 p-0" onClick={handleDecline} aria-label={c.close}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
