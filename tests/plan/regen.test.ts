import { describe, it, expect } from 'vitest';
import { getLockedMealsForRegen, isPlanFullyInPast } from '../../src/lib/plan/regen';
import type { PlannedMeal } from '../../src/types/plan';
import type { Plan } from '../../src/types/plan';

const TODAY = '2026-04-25';

function meal(date: string, locked = false): PlannedMeal {
  return { date, dishId: 'kotlet', isLeftover: false, locked };
}

const basePlan: Plan = {
  id: 'p1',
  name: 'Test',
  createdAt: '2026-04-01T00:00:00.000Z',
  startDate: '2026-04-20',
  endDate: '2026-04-30',
  fitness: 100,
  violations: [],
  meals: [],
};

describe('getLockedMealsForRegen', () => {
  it('returns meals with date < today as locked', () => {
    const meals = [meal('2026-04-23'), meal('2026-04-24'), meal('2026-04-25'), meal('2026-04-26')];
    const locked = getLockedMealsForRegen(meals, TODAY);
    expect(locked.map((m) => m.date)).toEqual(['2026-04-23', '2026-04-24']);
  });

  it("today's meal is NOT included (not strictly less than)", () => {
    const meals = [meal(TODAY)];
    const locked = getLockedMealsForRegen(meals, TODAY);
    expect(locked).toHaveLength(0);
  });

  it('explicitly locked future meals are included', () => {
    const meals = [meal('2026-04-26', true), meal('2026-04-27', false)];
    const locked = getLockedMealsForRegen(meals, TODAY);
    expect(locked.map((m) => m.date)).toEqual(['2026-04-26']);
  });

  it('past meal that is also locked is included once', () => {
    const meals = [meal('2026-04-23', true)];
    const locked = getLockedMealsForRegen(meals, TODAY);
    expect(locked).toHaveLength(1);
  });

  it('returns empty when all meals are future and unlocked', () => {
    const meals = [meal('2026-04-26'), meal('2026-04-27')];
    expect(getLockedMealsForRegen(meals, TODAY)).toHaveLength(0);
  });

  it('returns all meals when all are in the past', () => {
    const meals = [meal('2026-04-20'), meal('2026-04-21'), meal('2026-04-22')];
    expect(getLockedMealsForRegen(meals, TODAY)).toHaveLength(3);
  });

  it('returns empty for an empty meal list', () => {
    expect(getLockedMealsForRegen([], TODAY)).toHaveLength(0);
  });
});

describe('isPlanFullyInPast', () => {
  it('returns true when endDate is before today', () => {
    const plan = { ...basePlan, endDate: '2026-04-24' };
    expect(isPlanFullyInPast(plan, TODAY)).toBe(true);
  });

  it('returns false when endDate equals today', () => {
    const plan = { ...basePlan, endDate: TODAY };
    expect(isPlanFullyInPast(plan, TODAY)).toBe(false);
  });

  it('returns false when endDate is after today', () => {
    const plan = { ...basePlan, endDate: '2026-04-30' };
    expect(isPlanFullyInPast(plan, TODAY)).toBe(false);
  });
});
