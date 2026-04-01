import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Cookie, Settings } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'servio-cookie-consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

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
                  Servio gebruikt essentiële cookies voor de werking van de app en optionele analytics cookies om de ervaring te verbeteren.
                  Lees ons{' '}
                  <a href="/privacy" className="text-primary underline">privacybeleid</a>
                  {' '}en{' '}
                  <a href="/cookies" className="text-primary underline">cookiebeleid</a> voor meer informatie.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleAccept}>Accepteren</Button>
                <Button size="sm" variant="outline" onClick={handleDecline}>Alleen essentieel</Button>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleDecline}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
