import { describe, it, expect } from 'vitest';
import { buildLockedMealsForExtend, validateExtendRange } from '../../src/lib/plan/extend';
import type { PlannedMeal } from '../../src/types/plan';

function meal(date: string, dishId = 'kotlet', isLeftover = false, locked = false): PlannedMeal {
  return { date, dishId, isLeftover, locked };
}

const SOURCE_MEALS: PlannedMeal[] = [
  meal('2026-04-20'),
  meal('2026-04-21', 'rosol'),
  meal('2026-04-22', 'rosol', true),
  meal('2026-04-23', 'ryba'),
  meal('2026-04-24'),
  meal('2026-04-25'),
  meal('2026-04-26', 'gulasz'),
  meal('2026-04-27', 'gulasz', true),
];

describe('buildLockedMealsForExtend', () => {
  it('returns meals within the range, all locked', () => {
    const result = buildLockedMealsForExtend(SOURCE_MEALS, '2026-04-24', '2026-04-26');
    expect(result.map((m) => m.date)).toEqual(['2026-04-24', '2026-04-25', '2026-04-26']);
    expect(result.every((m) => m.locked)).toBe(true);
  });

  it('preserves dishId and isLeftover from source', () => {
    const result = buildLockedMealsForExtend(SOURCE_MEALS, '2026-04-21', '2026-04-22');
    expect(result[0].dishId).toBe('rosol');
    expect(result[0].isLeftover).toBe(false);
    expect(result[1].isLeftover).toBe(true);
  });

  it('does not mutate original meals (source locked flag unchanged)', () => {
    const original = meal('2026-04-20', 'kotlet', false, false);
    buildLockedMealsForExtend([original], '2026-04-20', '2026-04-20');
    expect(original.locked).toBe(false);
  });

  it('returns empty array when range is outside plan meals', () => {
    const result = buildLockedMealsForExtend(SOURCE_MEALS, '2026-05-01', '2026-05-03');
    expect(result).toHaveLength(0);
  });

  it('includes single-day range', () => {
    const result = buildLockedMealsForExtend(SOURCE_MEALS, '2026-04-23', '2026-04-23');
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-04-23');
    expect(result[0].locked).toBe(true);
  });

  it('includes full plan range', () => {
    const result = buildLockedMealsForExtend(SOURCE_MEALS, '2026-04-20', '2026-04-27');
    expect(result).toHaveLength(SOURCE_MEALS.length);
  });
});

describe('validateExtendRange', () => {
  const PLAN_START = '2026-04-20';
  const PLAN_END = '2026-04-27';

  it('valid when fully within bounds', () => {
    expect(validateExtendRange('2026-04-22', '2026-04-25', PLAN_START, PLAN_END)).toEqual({ valid: true });
  });

  it('valid when range equals plan bounds exactly', () => {
    expect(validateExtendRange(PLAN_START, PLAN_END, PLAN_START, PLAN_END)).toEqual({ valid: true });
  });

  it('valid for single-day range', () => {
    expect(validateExtendRange('2026-04-24', '2026-04-24', PLAN_START, PLAN_END)).toEqual({ valid: true });
  });

  it('invalid when rangeStart is before planStart', () => {
    const result = validateExtendRange('2026-04-19', '2026-04-25', PLAN_START, PLAN_END);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('extend.rangeOutOfBounds');
  });

  it('invalid when rangeEnd is after planEnd', () => {
    const result = validateExtendRange('2026-04-22', '2026-04-28', PLAN_START, PLAN_END);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('extend.rangeOutOfBounds');
  });

  it('invalid when rangeStart is after rangeEnd', () => {
    const result = validateExtendRange('2026-04-25', '2026-04-22', PLAN_START, PLAN_END);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('extend.rangeOutOfBounds');
  });
});
