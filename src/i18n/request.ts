import { getRequestConfig } from 'next-intl/server';
import { locales, Locale, defaultLocale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  // Get the requested locale
  let locale = await requestLocale;

  // Validate that the incoming locale is valid, otherwise use default
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
