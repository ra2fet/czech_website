import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/translation.json';
import nlTranslation from './locales/nl/translation.json';

const resources = {
  en: {
    translation: enTranslation,
  },
  nl: {
    translation: nlTranslation,
  },
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Passes i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Default language if detection fails
    debug: process.env.NODE_ENV === 'development', // Enable debug mode only in development
    interpolation: {
      escapeValue: false, // React already escapes by default
      skipOnVariables: false, // Ensure variables are processed
      prefix: '{',
      suffix: '}',
    },
    returnObjects: false,
    keySeparator: false, // Allow dots in keys
    nsSeparator: false, // Disable namespace separator
    detection: {
      order: ['localStorage', 'navigator'], // Order of language detection
      caches: ['localStorage'], // Cache detected language
    },
  });

export default i18n;