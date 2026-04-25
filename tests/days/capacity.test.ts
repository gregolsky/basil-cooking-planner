import { describe, it, expect } from 'vitest';
import { computeDayContext, buildDayContexts } from '../../src/lib/days/capacity';
import type { DayModifier } from '../../src/types/day';

// 2026-04-20 = Monday (weekday)
// 2026-04-25 = Saturday (weekend)

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
    expect(ctx.skip).toBe(false);
    expect(ctx.requiresTags).toEqual([]);
  });

  it('weekend without modifiers: cap=5, isWeekend=true', () => {
    const ctx = computeDayContext('2026-04-25', noMods());
    expect(ctx.difficultyCap).toBe(5);
    expect(ctx.isWeekend).toBe(true);
  });

  it('explicit difficultyCap overrides base cap', () => {
    const mods = modMap({ date: '2026-04-20', difficultyCap: 5 });
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
    const mods: DayModifier[] = [{ date: '2025-01-01', skip: true }];
    const ctx = buildDayContexts(['2026-04-20'], mods);
    expect(ctx[0].skip).toBe(false);
    expect(ctx[0].difficultyCap).toBe(3);
  });

  it('applies modifiers to the correct date', () => {
    const mods: DayModifier[] = [{ date: '2026-04-20', skip: true }];
    const contexts = buildDayContexts(['2026-04-20', '2026-04-21'], mods);
    expect(contexts[0].skip).toBe(true);
    expect(contexts[1].skip).toBe(false);
  });
});
