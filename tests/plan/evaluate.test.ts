import { describe, it, expect } from 'vitest';
import { evaluatePlan } from '../../src/lib/plan/evaluate';
import { evaluate } from '../../src/lib/ga/fitness';
import { buildDayContexts } from '../../src/lib/days/capacity';
import { dishes } from '../ga/fixtures';
import type { Plan } from '../../src/types/plan';

const dishMap = new Map(dishes.map((d) => [d.id, d]));

const simplePlan: Plan = {
  id: 'p1',
  name: 'Test',
  createdAt: '2026-04-25T00:00:00.000Z',
  startDate: '2026-04-20',
  endDate: '2026-04-22',
  fitness: 0,
  violations: [],
  meals: [
    { date: '2026-04-20', dishId: 'kotlet', isLeftover: false, locked: false },
    { date: '2026-04-21', dishId: 'rosol', isLeftover: false, locked: false },
    { date: '2026-04-22', dishId: 'ryba', isLeftover: false, locked: false },
  ],
};

describe('evaluatePlan', () => {
  it('returns fitness and violations', () => {
    const result = evaluatePlan(simplePlan, dishes, []);
    expect(typeof result.fitness).toBe('number');
    expect(Array.isArray(result.violations)).toBe(true);
  });

  it('result is consistent with calling evaluate directly', () => {
    const days = buildDayContexts(simplePlan.meals.map((m) => m.date), []);
    const direct = evaluate({ meals: simplePlan.meals, days, dishMap, tagDefs: [] });
    const wrapped = evaluatePlan(simplePlan, dishes, []);
    expect(wrapped.fitness).toBe(direct.score);
    expect(wrapped.violations).toEqual(direct.violations);
  });

  it('plan with no meals returns no violations', () => {
    const emptyPlan: Plan = { ...simplePlan, meals: [] };
    const result = evaluatePlan(emptyPlan, dishes, []);
    expect(result.violations).toHaveLength(0);
  });

  it('unknown dish IDs do not crash', () => {
    const plan: Plan = {
      ...simplePlan,
      meals: [{ date: '2026-04-20', dishId: 'nonexistent', isLeftover: false, locked: false }],
    };
    expect(() => evaluatePlan(plan, dishes, [])).not.toThrow();
  });
});
