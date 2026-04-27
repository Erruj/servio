import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import servioLogo from '@/assets/servio-logo-full.png';

export function LandingFooter() {
  const { t, i18n } = useTranslation();
  const prefix = i18n.language?.startsWith('en') ? '/en' : '';

  return (
    <footer className="py-16 border-t border-border/40">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-5 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center mb-4" aria-label="Servio logo">
              <img src={servioLogo} alt="Servio logo" className="h-10 w-auto" loading="lazy" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {t('marketing.footer.tagline')}
            </p>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-4 text-sm">{t('marketing.footer.product')}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to={`${prefix}/features`} className="text-muted-foreground hover:text-foreground transition-colors">{t('marketing.nav.features')}</Link></li>
              <li><Link to={`${prefix}/pricing`} className="text-muted-foreground hover:text-foreground transition-colors">{t('marketing.nav.pricing')}</Link></li>
              <li><Link to={`${prefix}/about`} className="text-muted-foreground hover:text-foreground transition-colors">{t('marketing.nav.about')}</Link></li>
              <li><Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">{t('marketing.nav.login')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-4 text-sm">{t('marketing.footer.support')}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to={`${prefix}/contact`} className="text-muted-foreground hover:text-foreground transition-colors">{t('marketing.footer.contact')}</Link></li>
              <li><a href="mailto:info@getservio.co" className="text-muted-foreground hover:text-foreground transition-colors">info@getservio.co</a></li>
              <li><Link to="/signup" className="text-muted-foreground hover:text-foreground transition-colors">{t('marketing.footer.createAccount')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-4 text-sm">{t('marketing.footer.legal')}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to={`${prefix}/privacy`} className="text-muted-foreground hover:text-foreground transition-colors">{t('marketing.footer.privacyPolicy')}</Link></li>
              <li><Link to={`${prefix}/terms`} className="text-muted-foreground hover:text-foreground transition-colors">{t('marketing.footer.terms')}</Link></li>
              <li><Link to={`${prefix}/cookies`} className="text-muted-foreground hover:text-foreground transition-colors">{t('marketing.footer.cookies')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {t('marketing.footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <div className="text-sm text-muted-foreground">
            {t('marketing.footer.madeIn')}
          </div>
        </div>
      </div>
    </footer>
  );
}
