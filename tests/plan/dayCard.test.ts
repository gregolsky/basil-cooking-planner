import { describe, it, expect } from 'vitest';
import { isPinDisabled, cookedDifficulty } from '../../src/lib/plan/dayCard';
import type { PlannedMeal } from '../../src/types/plan';
import type { DayContext } from '../../src/lib/days/capacity';

function meal(overrides: Partial<PlannedMeal> = {}): PlannedMeal {
  return { date: '2026-01-01', dishId: 'd1', isLeftover: false, locked: false, ...overrides };
}

function day(overrides: Partial<DayContext> = {}): DayContext {
  return { date: '2026-01-01', difficultyCap: 3, skip: false, requiresTags: [], ...overrides };
}

describe('isPinDisabled', () => {
  it('is enabled for a normal cooked, non-past day', () => {
    expect(isPinDisabled(meal(), day(), false)).toBe(false);
  });

  it('is disabled when there is no dish assigned', () => {
    expect(isPinDisabled(meal({ dishId: null }), day(), false)).toBe(true);
  });

  it('is disabled for a leftover meal', () => {
    expect(isPinDisabled(meal({ isLeftover: true, sourceDate: '2025-12-31' }), day(), false)).toBe(true);
  });

  it('is disabled when the day is skipped', () => {
    expect(isPinDisabled(meal(), day({ skip: true }), false)).toBe(true);
  });

  it('is disabled when the day is in the past', () => {
    expect(isPinDisabled(meal(), day(), true)).toBe(true);
  });
});

describe('cookedDifficulty', () => {
  it("returns the dish's difficulty for a normal cooked meal", () => {
    expect(cookedDifficulty(meal(), 4)).toBe(4);
  });

  it('returns 0 for a leftover meal even if the source dish is difficult', () => {
    expect(cookedDifficulty(meal({ isLeftover: true, sourceDate: '2025-12-31' }), 5)).toBe(0);
  });

  it('returns 0 when no dish is resolved', () => {
    expect(cookedDifficulty(meal(), undefined)).toBe(0);
  });
});
