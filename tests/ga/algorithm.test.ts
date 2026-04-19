import { describe, it, expect } from 'vitest';
import { runGA } from '../../src/lib/ga/algorithm';
import { dishes, simpleDays } from './fixtures';

describe('runGA', () => {
  it('avoids same meat on consecutive days given enough variety', () => {
    const days = simpleDays('2026-04-20', 7);
    days.forEach((d) => { d.difficultyCap = 5; });
    const plan = runGA({
      dishes,
      days,
      lockedMeals: [],
      config: { populationSize: 40, generations: 100, seed: 42 },
    });
    const hardViolations = plan.violations.filter((v) => v.severity === 'hard');
    expect(hardViolations).toHaveLength(0);
  });

  it('respects locked meals (pins stay in place)', () => {
    const days = simpleDays('2026-04-20', 5);
    days.forEach((d) => { d.difficultyCap = 5; });
    const locked = [
      { date: '2026-04-22', dishId: 'kotlet', isLeftover: false, locked: true },
    ];
    const plan = runGA({
      dishes,
      days,
      lockedMeals: locked,
      config: { populationSize: 30, generations: 50, seed: 7 },
    });
    const mealOnDay = plan.meals.find((m) => m.date === '2026-04-22');
    expect(mealOnDay?.dishId).toBe('kotlet');
    expect(mealOnDay?.locked).toBe(true);
  });

  it('produces leftover for multi-day dishes', () => {
    const days = simpleDays('2026-04-20', 5);
    days.forEach((d) => { d.difficultyCap = 5; });
    const plan = runGA({
      dishes: [dishes.find((d) => d.id === 'rosol')!],
      days,
      lockedMeals: [],
      config: { populationSize: 10, generations: 10, seed: 3 },
    });
    expect(plan.meals.some((m) => m.isLeftover)).toBe(true);
  });
});
