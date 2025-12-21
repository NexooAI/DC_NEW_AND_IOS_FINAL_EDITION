import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/i18n';

export const useTranslation = () => {
  const { locale, setLocale, supportedLocales } = useLanguage();

  return {
    t,
    locale,
    setLocale,
    supportedLocales,
    isEnglish: locale === 'en',
    isMalayalam: locale === 'mal',
    isTamil: locale === 'ta',
  };
};

export default useTranslation; 