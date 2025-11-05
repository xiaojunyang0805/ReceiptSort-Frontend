export const locales = ['en', 'nl', 'de', 'fr', 'es', 'ja', 'zh'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  nl: 'Nederlands',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  ja: '日本語',
  zh: '简体中文',
};
