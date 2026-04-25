import { describe, it, expect } from 'vitest';
import { runGA } from '../../src/lib/ga/algorithm';
import type { Dish } from '../../src/types/dish';
import { dishes, simpleDays } from './fixtures';

const TAG_SOUP = 'soup';

// Two soups + four other dishes with enough meat variety for the GA to work
const dishesWithSoups: Dish[] = [
  ...dishes,
  { id: 'zupa1', name: 'Zupa pomidorowa', meat: 'poultry', difficulty: 1, preference: 3, tags: [TAG_SOUP], servesDays: 1 },
  { id: 'zupa2', name: 'Zupa kalafiorowa', meat: 'none',    difficulty: 1, preference: 3, tags: [TAG_SOUP], servesDays: 1 },
];

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

  it('respects tagDefs maxPerWeek — at most 1 soup per week', () => {
    // Mon–Sun (one calendar week)
    const days = simpleDays('2026-04-20', 7);
    days.forEach((d) => { d.difficultyCap = 5; });
    const plan = runGA({
      dishes: dishesWithSoups,
      days,
      lockedMeals: [],
      config: { populationSize: 60, generations: 150, seed: 42 },
      tagDefs: [{ id: TAG_SOUP, name: 'Zupa', maxPerWeek: 1 }],
    });
    expect(plan.violations.filter((v) => v.kind === 'tag_week_limit')).toHaveLength(0);
  });

  it('respects tagDefs minGapDays — soup not repeated too soon', () => {
    // 14 days to give the GA room to place a soup twice with the required gap
    const days = simpleDays('2026-04-20', 14);
    days.forEach((d) => { d.difficultyCap = 5; });
    const plan = runGA({
      dishes: dishesWithSoups,
      days,
      lockedMeals: [],
      config: { populationSize: 60, generations: 150, seed: 99 },
      tagDefs: [{ id: TAG_SOUP, name: 'Zupa', minGapDays: 5 }],
    });
    expect(plan.violations.filter((v) => v.kind === 'tag_gap')).toHaveLength(0);
  });
});
