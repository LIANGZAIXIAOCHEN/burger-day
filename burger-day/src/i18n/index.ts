import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import zhCN from './locales/zh-CN.json';
import zhTW from './locales/zh-TW.json';
import en from './locales/en.json';

const resources = {
  'zh-CN': { translation: zhCN },
  'zh-TW': { translation: zhTW },
  'en': { translation: en },
};

// Detect device language, default to Chinese
const deviceLanguage = getLocales()?.[0]?.languageCode ?? 'en';
const deviceLanguageTag = getLocales()?.[0]?.languageTag ?? 'en';

// Map language codes to available locales
const getInitialLocale = (): string => {
  if (deviceLanguageTag.startsWith('zh-TW') || deviceLanguageTag.startsWith('zh-HK')) {
    return 'zh-TW';
  }
  if (deviceLanguage === 'zh') {
    return 'zh-CN';
  }
  return 'en';
};

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLocale(),
  fallbackLng: 'zh-CN',
  interpolation: {
    escapeValue: false, // React already safes from XSS
  },
  compatibilityJSON: 'v4',
});

export default i18n;
