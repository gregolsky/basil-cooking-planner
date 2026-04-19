import { describe, it, expect } from 'vitest';
import { evaluate, DEFAULT_WEIGHTS } from '../../src/lib/ga/fitness';
import { dishes, simpleDays, TAG_NANNY } from './fixtures';

const dishMap = new Map(dishes.map((d) => [d.id, d]));

describe('fitness', () => {
  it('penalises same meat two days in a row', () => {
    const days = simpleDays('2026-04-20', 2);
    const meals = [
      { date: days[0].date, dishId: 'rosol', isLeftover: false, locked: false },
      { date: days[1].date, dishId: 'kurczak', isLeftover: false, locked: false },
    ];
    const { score, violations } = evaluate({ meals, days, dishMap });
    expect(violations.some((v) => v.kind === 'same_meat')).toBe(true);
    expect(score).toBeLessThan(0);
  });

  it('no penalty when meat differs', () => {
    const days = simpleDays('2026-04-20', 2);
    const meals = [
      { date: days[0].date, dishId: 'kotlet', isLeftover: false, locked: false },
      { date: days[1].date, dishId: 'ryba', isLeftover: false, locked: false },
    ];
    const { violations } = evaluate({ meals, days, dishMap });
    expect(violations.filter((v) => v.kind === 'same_meat')).toHaveLength(0);
  });

  it('penalises difficulty overrun on weekday', () => {
    const days = simpleDays('2026-04-20', 1);
    days[0].difficultyCap = 2;
    const meals = [{ date: days[0].date, dishId: 'gulasz', isLeftover: false, locked: false }];
    const { violations } = evaluate({ meals, days, dishMap });
    expect(violations.some((v) => v.kind === 'difficulty_overrun')).toBe(true);
  });

  it('penalises missing required tag', () => {
    const days = simpleDays('2026-04-20', 1);
    days[0].requiresTags = [TAG_NANNY];
    const meals = [{ date: days[0].date, dishId: 'gulasz', isLeftover: false, locked: false }];
    const { score, violations } = evaluate({ meals, days, dishMap });
    expect(violations.some((v) => v.kind === 'tag_required')).toBe(true);
    expect(score).toBeLessThanOrEqual(-DEFAULT_WEIGHTS.tagRequirementPenalty);
  });

  it('passes when dish has required tag', () => {
    const days = simpleDays('2026-04-20', 1);
    days[0].requiresTags = [TAG_NANNY];
    const meals = [{ date: days[0].date, dishId: 'pasta', isLeftover: false, locked: false }];
    const { violations } = evaluate({ meals, days, dishMap });
    expect(violations.filter((v) => v.kind === 'tag_required')).toHaveLength(0);
  });

  it('rewards preference', () => {
    const days = simpleDays('2026-04-20', 1);
    const meals = [{ date: days[0].date, dishId: 'pasta', isLeftover: false, locked: false }];
    const { score } = evaluate({ meals, days, dishMap });
    expect(score).toBeGreaterThan(0);
  });

  it('flags tag weekly limit exceeded', () => {
    const days = simpleDays('2026-04-20', 5);
    const meals = days.map((d) => ({ date: d.date, dishId: 'pasta', isLeftover: false, locked: false }));
    const tagDefs = [{ id: TAG_NANNY, name: 'niania', maxPerWeek: 2 }];
    const { violations } = evaluate({ meals, days, dishMap, tagDefs });
    expect(violations.some((v) => v.kind === 'tag_week_limit')).toBe(true);
  });
});
