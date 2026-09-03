export type AppLocale = 'pl' | 'en';

/**
 * Maps a detected BCP-47 language tag (e.g. from i18next-browser-languagedetector)
 * to one of the app's supported locales, defaulting to Polish for anything
 * unrecognized or missing.
 */
export function resolveInitialLocale(detected: string | undefined): AppLocale {
  if (detected?.toLowerCase().startsWith('en')) return 'en';
  return 'pl';
}
