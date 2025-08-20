import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function useLanguagePersistence() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Load saved language on mount
    const savedLanguage = localStorage.getItem('servio-language');
    if (savedLanguage && savedLanguage !== i18n.language) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  useEffect(() => {
    // Save language changes to localStorage
    const handleLanguageChange = (lng: string) => {
      localStorage.setItem('servio-language', lng);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);
}