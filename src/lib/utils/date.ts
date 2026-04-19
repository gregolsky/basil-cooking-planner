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
