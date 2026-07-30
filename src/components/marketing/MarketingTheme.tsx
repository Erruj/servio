import { ReactNode } from 'react';

/**
 * Scoped marketing theme wrapper.
 * Alle marketing- en legal-pagina's renderen binnen deze wrapper zodat de
 * donkere fintech-tokens uit index.css alleen daar gelden. De ingelogde app
 * blijft het bestaande licht/donker-thema gebruiken.
 */
export function MarketingTheme({ children }: { children: ReactNode }) {
  return <div className="marketing-theme min-h-screen">{children}</div>;
}
