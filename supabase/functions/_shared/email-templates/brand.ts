// ═══════════════════════════════════════════════════════════════════════════
//  SERVIO E-MAIL HUISSTIJL
//  Kleuren en logo voor alle uitgaande e-mails. Overeenkomend met src/index.css.
//  Pas hier iets aan en het geldt direct voor álle e-mailtemplates.
// ═══════════════════════════════════════════════════════════════════════════

export const brand = {
  name: 'Servio',
  siteUrl: 'https://getservio.co',
  logoUrl: 'https://getservio.co/favicon.png',

  // Kleuren (gelijk aan de app)
  primary: '#2563eb',
  pageBackground: '#f5f5f7',
  cardBackground: '#ffffff',
  heading: '#1d1d1f',
  bodyText: '#4b4b50',
  mutedText: '#6e6e73',
  border: '#e5e5e5',

  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

// ─── Gedeelde stijlen ──────────────────────────────────────────────────────
export const styles = {
  main: {
    backgroundColor: brand.pageBackground,
    fontFamily: brand.fontFamily,
    padding: '40px 0',
    margin: '0',
  },
  outerContainer: {
    maxWidth: '520px',
    margin: '0 auto',
    padding: '20px',
  },
  card: {
    backgroundColor: brand.cardBackground,
    borderRadius: '16px',
    padding: '40px 32px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.04)',
  },
  logoSection: {
    textAlign: 'center' as const,
    marginBottom: '4px',
  },
  logoImage: {
    display: 'inline-block',
    verticalAlign: 'middle',
    marginRight: '10px',
  },
  logoText: {
    fontSize: '22px',
    fontWeight: '700' as const,
    color: brand.primary,
    margin: '0',
    letterSpacing: '-0.4px',
    display: 'inline-block',
    verticalAlign: 'middle',
  },
  divider: {
    borderTop: `1px solid ${brand.border}`,
    margin: '24px 0',
  },
  icon: {
    fontSize: '34px',
    lineHeight: '1',
    textAlign: 'center' as const,
    margin: '0 0 14px',
  },
  subNote: {
    fontSize: '12px',
    color: brand.mutedText,
    textAlign: 'center' as const,
    margin: '8px 0 0',
    lineHeight: '1.6',
  },
  warning: {
    fontSize: '14px',
    color: brand.heading,
    lineHeight: '1.6',
    backgroundColor: '#fff8e6',
    border: '1px solid #f2dfae',
    borderRadius: '10px',
    padding: '14px 16px',
    margin: '20px 0 0',
  },
  signature: {
    fontSize: '15px',
    color: brand.bodyText,
    lineHeight: '1.65',
    margin: '24px 0 0',
    whiteSpace: 'pre-line' as const,
  },
  h1: {
    fontSize: '21px',
    fontWeight: '600' as const,
    color: brand.heading,
    margin: '0 0 18px',
    letterSpacing: '-0.4px',
    lineHeight: '1.35',
  },
  text: {
    fontSize: '15px',
    color: brand.bodyText,
    lineHeight: '1.65',
    margin: '0 0 16px',
  },
  buttonContainer: {
    textAlign: 'center' as const,
    margin: '28px 0 18px',
  },
  button: {
    backgroundColor: brand.primary,
    color: '#ffffff',
    fontSize: '15px',
    borderRadius: '10px',
    padding: '14px 32px',
    textDecoration: 'none',
    fontWeight: '600' as const,
    display: 'inline-block',
  },
  code: {
    fontSize: '30px',
    fontWeight: '700' as const,
    color: brand.heading,
    letterSpacing: '8px',
    textAlign: 'center' as const,
    backgroundColor: brand.pageBackground,
    borderRadius: '10px',
    padding: '18px 0',
    margin: '8px 0 18px',
  },
  note: {
    fontSize: '13px',
    color: brand.mutedText,
    textAlign: 'center' as const,
    margin: '0',
  },
  footer: {
    fontSize: '12px',
    color: brand.mutedText,
    textAlign: 'center' as const,
    margin: '0',
    lineHeight: '1.6',
  },
  link: {
    color: brand.primary,
    textDecoration: 'none',
  },
}
