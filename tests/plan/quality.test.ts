import { describe, it, expect } from 'vitest';
import { computePlanQuality } from '../../src/lib/plan/quality';
import type { PlannedMeal, Violation } from '../../src/types/plan';
import type { Dish } from '../../src/types/dish';

function dish(id: string, preference: Dish['preference']): Dish {
  return { id, name: id, meat: 'none', difficulty: 1, preference, tags: [], servesDays: 1 };
}

function meal(dishId: string | null, opts: Partial<PlannedMeal> = {}): PlannedMeal {
  return { date: '2026-01-01', dishId, isLeftover: false, locked: false, ...opts };
}

const dishMap = new Map([
  ['high', dish('high', 5)],
  ['mid', dish('mid', 3)],
  ['low', dish('low', 1)],
]);

describe('computePlanQuality', () => {
  it('returns null when any hard violation is present, regardless of preferences', () => {
    const violations: Violation[] = [{ date: '2026-01-01', severity: 'hard', kind: 'x', message: 'x' }];
    const result = computePlanQuality({ meals: [meal('high')], violations, dishMap });
    expect(result).toBeNull();
  });

  it("returns 'perfect' when average preference is 4.5 or above", () => {
    const meals = [meal('high'), meal('high')];
    expect(computePlanQuality({ meals, violations: [], dishMap })).toBe('perfect');
  });

  it("returns 'great' for average preference in [3.5, 4.5)", () => {
    const meals = [meal('high'), meal('mid')]; // avg 4.0
    expect(computePlanQuality({ meals, violations: [], dishMap })).toBe('great');
  });

  it("returns 'good' for average preference in [2.5, 3.5)", () => {
    const meals = [meal('mid'), meal('mid')]; // avg 3.0
    expect(computePlanQuality({ meals, violations: [], dishMap })).toBe('good');
  });

  it("returns 'could-be-better' for average preference below 2.5", () => {
    const meals = [meal('low'), meal('low')]; // avg 1.0
    expect(computePlanQuality({ meals, violations: [], dishMap })).toBe('could-be-better');
  });

  it('ignores leftover meals when averaging preference', () => {
    const meals = [meal('high'), meal('low', { isLeftover: true, sourceDate: '2026-01-01' })];
    expect(computePlanQuality({ meals, violations: [], dishMap })).toBe('perfect');
  });

  it('ignores meals with no dish assigned', () => {
    const meals = [meal('high'), meal(null)];
    expect(computePlanQuality({ meals, violations: [], dishMap })).toBe('perfect');
  });

  it('returns null when there are no cooked meals at all', () => {
    const meals = [meal(null), meal(null, { isLeftover: true })];
    expect(computePlanQuality({ meals, violations: [], dishMap })).toBeNull();
  });

  it('soft and info violations do not suppress a quality tier', () => {
    const violations: Violation[] = [
      { date: '2026-01-01', severity: 'soft', kind: 'x', message: 'x' },
      { date: '2026-01-01', severity: 'info', kind: 'y', message: 'y' },
    ];
    const meals = [meal('high')];
    expect(computePlanQuality({ meals, violations, dishMap })).toBe('perfect');
  });
});
