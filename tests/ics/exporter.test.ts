import { describe, it, expect } from 'vitest';
import { planToIcs, icsFileName } from '../../src/lib/ics/exporter';
import type { Dish, MeatType } from '../../src/types/dish';
import type { Plan } from '../../src/types/plan';

const dishes: Dish[] = [
  { id: 'd1', name: 'Pierogi ruskie', meat: 'none', difficulty: 3, preference: 5, tags: ['tag-comfort'], servesDays: 1 },
  { id: 'd2', name: 'Kurczak w curry, ostry; pikantny\\ostry', meat: 'poultry', difficulty: 2, preference: 4, tags: [], servesDays: 1 },
  {
    id: 'd3',
    name: 'Bardzo długa nazwa dania które ma naprawdę sporo znaków żeby wymusić zawijanie linii w pliku ICS według RFC 5545',
    meat: 'beef',
    difficulty: 4,
    preference: 3,
    tags: ['tag-swieto', 'tag-niedziela'],
    servesDays: 1,
  },
];
const dishMap = new Map(dishes.map((d) => [d.id, d]));

const tagNames = new Map([
  ['tag-comfort', 'comfort'],
  ['tag-swieto', 'święto'],
  ['tag-niedziela', 'niedziela'],
]);

const labels = {
  calendarName: 'Testowy plan',
  difficulty: 'Trudność',
  tags: 'Etykiety',
  meatLabel: (m: MeatType) => ({ beef: 'wołowina', pork: 'wieprzowina', poultry: 'drób', fish: 'ryba', none: 'bezmięsne' }[m]),
  tagName: (id: string) => tagNames.get(id) ?? id,
};

function basePlan(meals: Plan['meals']): Plan {
  return {
    id: 'plan-1',
    createdAt: '2026-09-01T00:00:00.000Z',
    startDate: '2026-09-07',
    endDate: '2026-09-09',
    meals,
    fitness: 0,
    violations: [],
  };
}

describe('planToIcs', () => {
  it('emits one VEVENT per cooking day and skips leftovers and skipped days', () => {
    const plan = basePlan([
      { date: '2026-09-07', dishId: 'd1', isLeftover: false, locked: false },
      { date: '2026-09-08', dishId: 'd1', isLeftover: true, sourceDate: '2026-09-07', locked: false },
      { date: '2026-09-09', dishId: null, isLeftover: false, locked: false },
    ]);
    const ics = planToIcs(plan, dishMap, labels, new Date('2026-09-01T12:00:00.000Z'));
    const eventCount = (ics.match(/BEGIN:VEVENT/g) ?? []).length;
    expect(eventCount).toBe(1);
    expect(ics).toContain('Pierogi ruskie');
  });

  it('resolves dish tag IDs to display names via labels.tagName, not the raw IDs', () => {
    const plan = basePlan([{ date: '2026-09-07', dishId: 'd1', isLeftover: false, locked: false }]);
    const ics = planToIcs(plan, dishMap, labels, new Date('2026-09-01T12:00:00.000Z'));
    expect(ics).toContain('Etykiety: comfort');
    expect(ics).not.toContain('tag-comfort');
  });

  it('DTEND is the day after DTSTART (exclusive end for an all-day event)', () => {
    const plan = basePlan([{ date: '2026-09-07', dishId: 'd1', isLeftover: false, locked: false }]);
    const ics = planToIcs(plan, dishMap, labels, new Date('2026-09-01T12:00:00.000Z'));
    expect(ics).toContain('DTSTART;VALUE=DATE:20260907');
    expect(ics).toContain('DTEND;VALUE=DATE:20260908');
  });

  it('escapes commas, semicolons and backslashes in text values', () => {
    const plan = basePlan([{ date: '2026-09-07', dishId: 'd2', isLeftover: false, locked: false }]);
    const ics = planToIcs(plan, dishMap, labels, new Date('2026-09-01T12:00:00.000Z'));
    expect(ics).toContain('Kurczak w curry\\, ostry\\; pikantny\\\\ostry');
  });

  it('folds long lines at <=75 octets per physical line with CRLF + space continuation', () => {
    const plan = basePlan([{ date: '2026-09-07', dishId: 'd3', isLeftover: false, locked: false }]);
    const ics = planToIcs(plan, dishMap, labels, new Date('2026-09-01T12:00:00.000Z'));
    const physicalLines = ics.split('\r\n');
    for (const line of physicalLines) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    // Continuation lines start with a single space.
    expect(ics).toMatch(/\r\n [^\r\n]/);
  });

  it('uses CRLF line endings throughout and closes the calendar', () => {
    const plan = basePlan([{ date: '2026-09-07', dishId: 'd1', isLeftover: false, locked: false }]);
    const ics = planToIcs(plan, dishMap, labels, new Date('2026-09-01T12:00:00.000Z'));
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
    expect(ics.includes('\n') && !ics.includes('\r\n')).toBe(false);
  });

  it('produces a stable UID for the same plan and date across calls', () => {
    const plan = basePlan([{ date: '2026-09-07', dishId: 'd1', isLeftover: false, locked: false }]);
    const first = planToIcs(plan, dishMap, labels, new Date('2026-09-01T12:00:00.000Z'));
    const second = planToIcs(plan, dishMap, labels, new Date('2026-09-05T08:30:00.000Z'));
    const uid = 'UID:plan-1-2026-09-07@basil-cooking-planner';
    expect(first).toContain(uid);
    expect(second).toContain(uid);
  });
});

describe('icsFileName', () => {
  it('builds a file name from the plan date range', () => {
    const plan = basePlan([]);
    expect(icsFileName(plan)).toBe('basil-2026-09-07-2026-09-09.ics');
  });
});
