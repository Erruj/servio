import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Eigen tabbladtitel per app-pagina, zodat meerdere tabbladen herkenbaar zijn. */
const TITLES: [string, string][] = [
  ['/app', 'Inbox'],
  ['/dashboard', 'Dashboard'],
  ['/stats', 'Statistieken'],
  ['/templates', 'Templates'],
  ['/settings', 'Instellingen'],
  ['/profile', 'Profiel'],
  ['/team', 'Team'],
  ['/mailbox-setup', 'Mailbox koppelen'],
  ['/administration/overview', 'Financieel overzicht'],
  ['/administration/ai-assistant', 'AI-assistent'],
  ['/administration/invoices', 'Facturen'],
  ['/administration/quotes', 'Offertes'],
  ['/administration/receipts', 'Bonnetjes'],
  ['/administration/customers', 'Klanten'],
  ['/administration/time-tracking', 'Urenregistratie'],
  ['/administration/documents', 'Documenten'],
  ['/administration/exports', 'Exports'],
  ['/administration/audit-log', 'Auditlog'],
  ['/administration', 'Administratie'],
];

export function useAppPageTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const match = TITLES.find(([p]) => pathname === p || pathname.startsWith(p + '/'));
    if (!match) return;
    const title = `${match[1]} – Servio`;
    document.title = title;
    // Helmet kan na ons renderen; zet de titel na de volgende frame nogmaals.
    const id = requestAnimationFrame(() => { document.title = title; });
    return () => cancelAnimationFrame(id);
  }, [pathname]);
}
