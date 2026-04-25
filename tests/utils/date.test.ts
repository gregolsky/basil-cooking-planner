import { describe, it, expect } from 'vitest';
import {
  toISODate,
  fromISODate,
  addDays,
  daysBetween,
  listDates,
  isWeekend,
  weekdayPl,
  weekdayShortPl,
  formatPl,
  formatShortPl,
  calendarDayLabels,
} from '../../src/lib/utils/date';

describe('toISODate / fromISODate', () => {
  it('round-trips a date', () => {
    const iso = '2026-04-25';
    expect(toISODate(fromISODate(iso))).toBe(iso);
  });

  it('pads single-digit month and day with zeros', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('addDays', () => {
  it('adds positive days', () => {
    expect(addDays('2026-04-25', 5)).toBe('2026-04-30');
  });

  it('subtracts days when negative', () => {
    expect(addDays('2026-04-25', -5)).toBe('2026-04-20');
  });

  it('crosses month boundary', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
  });

  it('crosses year boundary', () => {
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
  });

  it('adding zero returns same date', () => {
    expect(addDays('2026-04-25', 0)).toBe('2026-04-25');
  });
});

describe('daysBetween', () => {
  it('returns 0 for same date', () => {
    expect(daysBetween('2026-04-25', '2026-04-25')).toBe(0);
  });

  it('returns positive for forward range', () => {
    expect(daysBetween('2026-04-20', '2026-04-25')).toBe(5);
  });

  it('returns negative for backward range', () => {
    expect(daysBetween('2026-04-25', '2026-04-20')).toBe(-5);
  });
});

describe('listDates', () => {
  it('returns all dates in range inclusive', () => {
    expect(listDates('2026-04-20', '2026-04-22')).toEqual([
      '2026-04-20',
      '2026-04-21',
      '2026-04-22',
    ]);
  });

  it('returns single element when start equals end', () => {
    expect(listDates('2026-04-20', '2026-04-20')).toEqual(['2026-04-20']);
  });

  it('returns empty array for inverted range', () => {
    expect(listDates('2026-04-25', '2026-04-20')).toEqual([]);
  });
});

describe('isWeekend', () => {
  // Week of 2026-04-20 (Monday)
  it('Mon–Fri are not weekend', () => {
    expect(isWeekend('2026-04-20')).toBe(false); // Mon
    expect(isWeekend('2026-04-21')).toBe(false); // Tue
    expect(isWeekend('2026-04-22')).toBe(false); // Wed
    expect(isWeekend('2026-04-23')).toBe(false); // Thu
    expect(isWeekend('2026-04-24')).toBe(false); // Fri
  });

  it('Sat and Sun are weekend', () => {
    expect(isWeekend('2026-04-25')).toBe(true); // Sat
    expect(isWeekend('2026-04-26')).toBe(true); // Sun
  });
});

describe('weekdayPl / weekdayShortPl', () => {
  it('returns Polish weekday name for Monday', () => {
    expect(weekdayPl('2026-04-20')).toBe('poniedziałek');
    expect(weekdayShortPl('2026-04-20')).toBe('pn');
  });

  it('returns Polish weekday name for Sunday', () => {
    expect(weekdayPl('2026-04-26')).toBe('niedziela');
    expect(weekdayShortPl('2026-04-26')).toBe('nd');
  });

  it('returns Polish weekday name for Saturday', () => {
    expect(weekdayPl('2026-04-25')).toBe('sobota');
    expect(weekdayShortPl('2026-04-25')).toBe('sb');
  });
});

describe('formatPl / formatShortPl', () => {
  it('zero-pads single-digit day and month', () => {
    expect(formatPl('2026-01-05')).toBe('05.01.2026');
    expect(formatShortPl('2026-01-05')).toBe('05.01');
  });

  it('formats double-digit day and month', () => {
    expect(formatPl('2026-12-31')).toBe('31.12.2026');
    expect(formatShortPl('2026-12-31')).toBe('31.12');
  });
});

describe('calendarDayLabels', () => {
  it('returns 7 labels regardless of weekStartDay', () => {
    expect(calendarDayLabels('pl', 0)).toHaveLength(7);
    expect(calendarDayLabels('pl', 1)).toHaveLength(7);
  });

  it('Mon-start places Monday first and Sunday last', () => {
    const sunStart = calendarDayLabels('pl', 0); // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
    const monStart = calendarDayLabels('pl', 1); // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
    expect(monStart[0]).toBe(sunStart[1]); // Mon moves to front
    expect(monStart[6]).toBe(sunStart[0]); // Sun moves to back
  });
});
