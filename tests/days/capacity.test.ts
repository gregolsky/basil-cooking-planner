import { describe, it, expect } from 'vitest';
import { computeDayContext, buildDayContexts } from '../../src/lib/days/capacity';
import type { DayModifier } from '../../src/types/day';

// 2026-04-20 = Monday (weekday)
// 2026-04-21 = Tuesday (weekday)
// 2026-04-25 = Saturday (weekend)
// 2026-04-26 = Sunday (weekend)

function noMods(): Map<string, DayModifier> {
  return new Map();
}

function modMap(...mods: DayModifier[]): Map<string, DayModifier> {
  return new Map(mods.map((m) => [m.date, m]));
}

describe('computeDayContext', () => {
  it('weekday without modifiers: cap=3, isWeekend=false', () => {
    const ctx = computeDayContext('2026-04-20', noMods());
    expect(ctx.difficultyCap).toBe(3);
    expect(ctx.isWeekend).toBe(false);
    expect(ctx.wifeDuty).toBe(false);
    expect(ctx.skip).toBe(false);
    expect(ctx.requiresTags).toEqual([]);
  });

  it('weekend without modifiers: cap=5, isWeekend=true', () => {
    const ctx = computeDayContext('2026-04-25', noMods());
    expect(ctx.difficultyCap).toBe(5);
    expect(ctx.isWeekend).toBe(true);
  });

  it('wifeDuty on current day reduces cap by 1', () => {
    const mods = modMap({ date: '2026-04-20', wifeDuty: true });
    const ctx = computeDayContext('2026-04-20', mods);
    expect(ctx.difficultyCap).toBe(2); // 3 - 1
    expect(ctx.wifeDuty).toBe(true);
  });

  it('wifeDuty on next day reduces cap by 1', () => {
    const mods = modMap({ date: '2026-04-21', wifeDuty: true });
    const ctx = computeDayContext('2026-04-20', mods);
    expect(ctx.difficultyCap).toBe(2); // 3 - 1 (next day duty)
    expect(ctx.wifeDuty).toBe(false); // today's wifeDuty is false
  });

  it('wifeDuty on both current and next day reduces cap by 2', () => {
    const mods = modMap(
      { date: '2026-04-20', wifeDuty: true },
      { date: '2026-04-21', wifeDuty: true },
    );
    const ctx = computeDayContext('2026-04-20', mods);
    expect(ctx.difficultyCap).toBe(1); // 3 - 2
  });

  it('cap is clamped to minimum 1', () => {
    const mods = modMap(
      { date: '2026-04-20', wifeDuty: true },
      { date: '2026-04-21', wifeDuty: true },
    );
    // Weekend base=5, -2 = 3, but a weekday with both duties is clamped: 3-2=1
    const ctx = computeDayContext('2026-04-20', mods);
    expect(ctx.difficultyCap).toBeGreaterThanOrEqual(1);
  });

  it('explicit difficultyCap overrides calculated value', () => {
    const mods = modMap({ date: '2026-04-20', wifeDuty: true, difficultyCap: 5 });
    const ctx = computeDayContext('2026-04-20', mods);
    expect(ctx.difficultyCap).toBe(5);
  });

  it('explicit difficultyCap=0 is clamped to 1', () => {
    const mods = modMap({ date: '2026-04-20', difficultyCap: 0 });
    const ctx = computeDayContext('2026-04-20', mods);
    expect(ctx.difficultyCap).toBe(1);
  });

  it('propagates skip flag', () => {
    const mods = modMap({ date: '2026-04-20', skip: true });
    const ctx = computeDayContext('2026-04-20', mods);
    expect(ctx.skip).toBe(true);
  });

  it('propagates requiresTags', () => {
    const mods = modMap({ date: '2026-04-20', requiresTags: ['tag1', 'tag2'] });
    const ctx = computeDayContext('2026-04-20', mods);
    expect(ctx.requiresTags).toEqual(['tag1', 'tag2']);
  });

  it('propagates note', () => {
    const mods = modMap({ date: '2026-04-20', note: 'test note' });
    const ctx = computeDayContext('2026-04-20', mods);
    expect(ctx.note).toBe('test note');
  });
});

describe('buildDayContexts', () => {
  it('returns one context per date', () => {
    const dates = ['2026-04-20', '2026-04-21', '2026-04-22'];
    const contexts = buildDayContexts(dates, []);
    expect(contexts).toHaveLength(3);
    expect(contexts.map((c) => c.date)).toEqual(dates);
  });

  it('returns empty array for empty dates', () => {
    expect(buildDayContexts([], [])).toEqual([]);
  });

  it('modifiers not matching any date are ignored', () => {
    const mods: DayModifier[] = [{ date: '2025-01-01', wifeDuty: true }];
    const ctx = buildDayContexts(['2026-04-20'], mods);
    expect(ctx[0].wifeDuty).toBe(false);
    expect(ctx[0].difficultyCap).toBe(3);
  });

  it('applies modifiers to the correct date', () => {
    const mods: DayModifier[] = [{ date: '2026-04-20', skip: true }];
    const contexts = buildDayContexts(['2026-04-20', '2026-04-21'], mods);
    expect(contexts[0].skip).toBe(true);
    expect(contexts[1].skip).toBe(false);
  });
});
