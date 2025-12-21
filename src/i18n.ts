import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from './locales/en.json';
import ta from './locales/ta.json';
import mal from './locales/mal.json';
import te from './locales/te.json';
import hi from './locales/hi.json';

export type AppLocale = 'en' | 'ta' | 'mal' | 'te' | 'hi';
const translations = { en, ta, mal, te, hi } as const;

const i18n = new I18n(translations);
i18n.enableFallback = true;

// Initialize with saved locale or device locale
export const initializeAppLocale = async () => {
  const saved = await AsyncStorage.getItem('user-locale');
  const deviceLocale = Localization.getLocales()[0].languageCode;

  // Only use device locale if it's one of our supported locales
  const supportedLocales: AppLocale[] = ['en', 'ta', 'mal', 'te', 'hi'];
  const validDeviceLocale = supportedLocales.includes(deviceLocale as AppLocale)
    ? (deviceLocale as AppLocale)
    : 'en';

  const initialLocale = (saved as AppLocale) || validDeviceLocale;

  i18n.locale = initialLocale;
  return initialLocale;
};

// Function to change locale and save to storage
export const changeLocale = async (locale: AppLocale) => {
  await AsyncStorage.setItem('user-locale', locale);
  i18n.locale = locale;
};

export const t = (key: string) => i18n.t(key);

export default i18n;