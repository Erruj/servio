import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import servioLogo from '@/assets/servio-logo-full.png';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
} from '@/components/aceternity/resizable-navbar';

export function LandingHeader() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const prefix = i18n.language?.startsWith('en') ? '/en' : '';

  const items = [
    { name: t('marketing.nav.features'), link: `${prefix}/features` },
    { name: t('marketing.nav.pricing'), link: `${prefix}/pricing` },
    { name: t('marketing.nav.blog'), link: `${prefix}/blog` },
    { name: t('marketing.nav.about'), link: `${prefix}/about` },
  ];

  const logo = (
    <Link to={prefix || '/'} className="relative z-20 flex items-center" aria-label="Servio">
      <img src={servioLogo} alt="Servio AI Business Assistant logo" className="h-8 md:h-9 w-auto" />
    </Link>
  );

  return (
    <Navbar>
      <NavBody>
        {logo}
        <NavItems items={items} />
        <div className="relative z-20 flex items-center gap-2">
          <LanguageSwitcher variant="marketing" />
          <Link to="/login" className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
            {t('marketing.nav.login')}
          </Link>
          <Link
            to="/signup"
            className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:scale-[0.97]"
          >
            {t('marketing.nav.startFree')}
          </Link>
        </div>
      </NavBody>

      <MobileNav>
        <MobileNavHeader>
          {logo}
          <MobileNavToggle
            isOpen={open}
            onClick={() => setOpen(!open)}
            openLabel={t('marketing.landing.menuOpen')}
            closeLabel={t('marketing.landing.menuClose')}
          />
        </MobileNavHeader>
        <MobileNavMenu isOpen={open} onClose={() => setOpen(false)}>
          {items.map((item) => (
            <Link
              key={item.link}
              to={item.link}
              onClick={() => setOpen(false)}
              className="w-full py-2 text-base font-medium text-neutral-700"
            >
              {item.name}
            </Link>
          ))}
          <div className="flex w-full flex-col gap-3 border-t border-neutral-200 pt-4">
            <LanguageSwitcher variant="marketing" />
            <Link to="/login" onClick={() => setOpen(false)} className="flex h-11 items-center justify-center rounded-full border border-neutral-200 text-sm font-medium text-neutral-800">
              {t('marketing.nav.login')}
            </Link>
            <Link to="/signup" onClick={() => setOpen(false)} className="flex h-11 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
              {t('marketing.nav.startFree')}
            </Link>
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}
