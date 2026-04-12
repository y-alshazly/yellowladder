export const SupportedLocales = {
  English: 'en',
  German: 'de',
  French: 'fr',
} as const;

export type SupportedLocale = (typeof SupportedLocales)[keyof typeof SupportedLocales];

export const DEFAULT_LOCALE: SupportedLocale = SupportedLocales.English;

export const SUPPORTED_LOCALE_LIST: readonly SupportedLocale[] = [
  SupportedLocales.English,
  SupportedLocales.German,
  SupportedLocales.French,
];
