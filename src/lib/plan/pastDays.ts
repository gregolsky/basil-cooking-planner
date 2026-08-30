/** True when an ISO date is strictly before today (today itself is not past). */
export function isPastDate(iso: string, today: string): boolean {
  return iso < today;
}

/** Splits date-bearing items into those before today and today-or-later, preserving order. */
export function splitByPast<T extends { date: string }>(
  items: T[],
  today: string,
): { past: T[]; upcoming: T[] } {
  const past: T[] = [];
  const upcoming: T[] = [];
  for (const item of items) {
    (isPastDate(item.date, today) ? past : upcoming).push(item);
  }
  return { past, upcoming };
}
