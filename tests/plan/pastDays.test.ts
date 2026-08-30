import { describe, it, expect } from 'vitest';
import { isPastDate, splitByPast } from '../../src/lib/plan/pastDays';

const TODAY = '2026-08-30';

describe('isPastDate', () => {
  it('returns true for a date before today', () => {
    expect(isPastDate('2026-08-29', TODAY)).toBe(true);
  });

  it("returns false for today itself (not strictly less than)", () => {
    expect(isPastDate(TODAY, TODAY)).toBe(false);
  });

  it('returns false for a date after today', () => {
    expect(isPastDate('2026-08-31', TODAY)).toBe(false);
  });
});

describe('splitByPast', () => {
  function item(date: string) {
    return { date };
  }

  it('splits items into past and upcoming, preserving order', () => {
    const items = [item('2026-08-28'), item('2026-08-29'), item(TODAY), item('2026-09-01')];
    const { past, upcoming } = splitByPast(items, TODAY);
    expect(past.map((i) => i.date)).toEqual(['2026-08-28', '2026-08-29']);
    expect(upcoming.map((i) => i.date)).toEqual([TODAY, '2026-09-01']);
  });

  it('puts everything in upcoming when all items are today or later', () => {
    const items = [item(TODAY), item('2026-09-05')];
    const { past, upcoming } = splitByPast(items, TODAY);
    expect(past).toHaveLength(0);
    expect(upcoming).toHaveLength(2);
  });

  it('puts everything in past when all items are before today', () => {
    const items = [item('2026-08-01'), item('2026-08-29')];
    const { past, upcoming } = splitByPast(items, TODAY);
    expect(past).toHaveLength(2);
    expect(upcoming).toHaveLength(0);
  });

  it('returns empty arrays for an empty input', () => {
    const { past, upcoming } = splitByPast([], TODAY);
    expect(past).toHaveLength(0);
    expect(upcoming).toHaveLength(0);
  });

  it('preserves extra fields on the original items', () => {
    const items = [{ date: '2026-08-29', dishId: 'x' }, { date: TODAY, dishId: 'y' }];
    const { past, upcoming } = splitByPast(items, TODAY);
    expect(past[0].dishId).toBe('x');
    expect(upcoming[0].dishId).toBe('y');
  });
});
