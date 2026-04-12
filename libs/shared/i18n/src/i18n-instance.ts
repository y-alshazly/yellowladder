import i18next, { type i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALE_LIST,
  SupportedLocales,
  type SupportedLocale,
} from './locales';
import deMessages from './messages/de.json';
import enMessages from './messages/en.json';
import frMessages from './messages/fr.json';

let initialised = false;

/**
 * Initialise the react-i18next instance with the Yellow Ladder catalogs.
 * Idempotent — safe to call multiple times.
 */
export function initialiseI18n(initialLocale: SupportedLocale = DEFAULT_LOCALE): I18nInstance {
  if (initialised) {
    return i18next;
  }
  i18next.use(initReactI18next).init({
    resources: {
      [SupportedLocales.English]: { translation: enMessages },
      [SupportedLocales.German]: { translation: deMessages },
      [SupportedLocales.French]: { translation: frMessages },
    },
    lng: initialLocale,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: SUPPORTED_LOCALE_LIST.slice(),
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  initialised = true;
  return i18next;
}

export { i18next };
