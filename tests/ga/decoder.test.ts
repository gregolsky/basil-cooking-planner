import { describe, it, expect } from 'vitest';
import { decode } from '../../src/lib/ga/decoder';
import { dishes, simpleDays } from './fixtures';

const dishMap = new Map(dishes.map((d) => [d.id, d]));

describe('decoder', () => {
  it('maps genes 1:1 to meals when no leftovers', () => {
    const days = simpleDays('2026-04-20', 3);
    const chromo = ['kotlet', 'ryba', 'pasta'];
    const meals = decode(chromo, { days, dishMap, lockedMeals: new Map() });
    expect(meals.map((m) => m.dishId)).toEqual(['kotlet', 'ryba', 'pasta']);
    expect(meals.every((m) => !m.isLeftover)).toBe(true);
  });

  it('propagates leftover for servesDays=2 dishes', () => {
    const days = simpleDays('2026-04-20', 3);
    const chromo = ['rosol', 'ryba', 'pasta'];
    const meals = decode(chromo, { days, dishMap, lockedMeals: new Map() });
    expect(meals[0].dishId).toBe('rosol');
    expect(meals[0].isLeftover).toBe(false);
    expect(meals[1].dishId).toBe('rosol');
    expect(meals[1].isLeftover).toBe(true);
    expect(meals[1].sourceDate).toBe('2026-04-20');
    expect(meals[2].dishId).toBe('pasta');
  });

  it('respects locked meals and overrides leftover chain', () => {
    const days = simpleDays('2026-04-20', 3);
    const locked = new Map([
      ['2026-04-21', { date: '2026-04-21', dishId: 'kotlet', isLeftover: false, locked: true }],
    ]);
    const chromo = ['rosol', 'ryba', 'pasta'];
    const meals = decode(chromo, { days, dishMap, lockedMeals: locked });
    expect(meals[0].dishId).toBe('rosol');
    expect(meals[1].dishId).toBe('kotlet');
    expect(meals[1].locked).toBe(true);
    expect(meals[2].dishId).toBe('pasta');
  });

  it('skips cooking on skip days', () => {
    const days = simpleDays('2026-04-20', 3);
    days[1].skip = true;
    const meals = decode(['kotlet', 'pasta', 'ryba'], { days, dishMap, lockedMeals: new Map() });
    expect(meals[1].dishId).toBe(null);
  });
});
