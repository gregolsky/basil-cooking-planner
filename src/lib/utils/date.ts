export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, n: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function daysBetween(startISO: string, endISO: string): number {
  const start = fromISODate(startISO);
  const end = fromISODate(endISO);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function listDates(startISO: string, endISO: string): string[] {
  const count = daysBetween(startISO, endISO) + 1;
  return Array.from({ length: count }, (_, i) => addDays(startISO, i));
}

// Legacy Polish-only functions — kept for use in Web Worker (fitness.ts) where i18n is unavailable
export function weekdayPl(iso: string): string {
  const names = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];
  return names[fromISODate(iso).getDay()];
}

export function weekdayShortPl(iso: string): string {
  const names = ['nd', 'pn', 'wt', 'śr', 'cz', 'pt', 'sb'];
  return names[fromISODate(iso).getDay()];
}

export function isWeekend(iso: string): boolean {
  const d = fromISODate(iso).getDay();
  return d === 0 || d === 6;
}

export function formatPl(iso: string): string {
  const d = fromISODate(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${d.getFullYear()}`;
}

export function formatShortPl(iso: string): string {
  const d = fromISODate(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Locale-aware versions — use these in UI components
export function weekdayLocale(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(fromISODate(iso));
}

export function weekdayShortLocale(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(fromISODate(iso));
}

export function formatDateLocale(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(fromISODate(iso));
}

export function formatShortDateLocale(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit' }).format(fromISODate(iso));
}

export function calendarDayLabels(locale: string, weekStartDay: 0 | 1): string[] {
  const sunLabels = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2023, 0, i + 1))
  );
  // 2023-01-01 is Sunday (0), so sunLabels[0]=Sun … sunLabels[6]=Sat
  if (weekStartDay === 1) {
    return [...sunLabels.slice(1), sunLabels[0]]; // Mon–Sun
  }
  return sunLabels; // Sun–Sat
}
