import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface SeoHeadProps {
  /** Pad zonder taalprefix, bijv. "/features" of "/" voor home */
  path: string;
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  children?: React.ReactNode;
}

/**
 * SEO head met automatische hreflang alternates en x-default voor meertalige marketing pagina's.
 */
export function SeoHead({ path, title, description, keywords, ogImage = 'https://getservio.co/og-image.png', children }: SeoHeadProps) {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const cleanPath = path === '/' ? '' : path;
  const nlUrl = `https://getservio.co${cleanPath || '/'}`;
  const enUrl = `https://getservio.co/en${cleanPath}`;
  const canonical = isEn ? enUrl : nlUrl;

  return (
    <Helmet>
      <html lang={isEn ? 'en' : 'nl'} />
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonical} />
      <link rel="alternate" hrefLang="nl" href={nlUrl} />
      <link rel="alternate" hrefLang="en" href={enUrl} />
      <link rel="alternate" hrefLang="x-default" href={nlUrl} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:locale" content={isEn ? 'en_US' : 'nl_NL'} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {children}
    </Helmet>
  );
}
