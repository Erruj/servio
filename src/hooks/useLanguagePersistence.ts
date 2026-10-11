import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { isMarketingPath, isLanguagePersistSuppressed } from '@/hooks/useUrlLanguageSync';

const SUPPORTED = ['nl', 'en', 'de', 'fr', 'es'];

/**
 * Houdt de taalkeuze in sync tussen marketingwebsite en app:
 * - localStorage ('servio-language') is de lokale fallback
 * - voor ingelogde gebruikers is user_settings.language leidend,
 *   zodat website en app overal dezelfde taal tonen
 * - elke taalwijziging wordt ook in het profiel opgeslagen
 */
export function useLanguagePersistence() {
  const { i18n } = useTranslation();
  const profileLoadedFor = useRef<string | null>(null);

  // Laad opgeslagen taal bij mount; voor ingelogde gebruikers wint het profiel
  useEffect(() => {
    const savedLanguage = localStorage.getItem('servio-language');
    const onMarketing = isMarketingPath(window.location.pathname);
    if (!onMarketing && savedLanguage && savedLanguage !== i18n.language) {
      i18n.changeLanguage(savedLanguage);
    }

    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id;
      if (!userId || cancelled || profileLoadedFor.current === userId) return;
      profileLoadedFor.current = userId;
      supabase
        .from('user_settings')
        .select('language')
        .eq('user_id', userId)
        .maybeSingle()
        .then(({ data: settings }) => {
          const lang = settings?.language;
          if (cancelled || !lang || !SUPPORTED.includes(lang)) return;
          if (!isMarketingPath(window.location.pathname) && lang !== i18n.language) {
            i18n.changeLanguage(lang);
          }
          try { localStorage.setItem('servio-language', lang); } catch { /* noop */ }
        });
    });

    return () => { cancelled = true; };
  }, [i18n]);

  // Sla elke taalwijziging op in localStorage én (indien ingelogd) in het profiel
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      if (isLanguagePersistSuppressed()) return;
      const code = lng.slice(0, 2);
      try { localStorage.setItem('servio-language', code); } catch { /* noop */ }
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          supabase
            .from('user_settings')
            .update({ language: code })
            .eq('user_id', data.user.id)
            .then(() => {});
        }
      });
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);
}
