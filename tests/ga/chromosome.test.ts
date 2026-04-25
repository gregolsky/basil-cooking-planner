import { describe, it, expect } from 'vitest';
import { buildSlots, randomChromosome } from '../../src/lib/ga/chromosome';
import { mulberry32 } from '../../src/lib/ga/rng';
import { dishes, simpleDays } from './fixtures';
import type { PlannedMeal } from '../../src/types/plan';

function noLocked(): Map<string, PlannedMeal> {
  return new Map();
}

describe('buildSlots', () => {
  it('unfixed slot includes all dishes when no constraints', () => {
    const days = simpleDays('2026-04-20', 1);
    days[0].difficultyCap = 5;
    const slots = buildSlots(days, dishes, noLocked());
    expect(slots[0].fixed).toBe(false);
    expect(slots[0].candidates.length).toBe(dishes.length);
  });

  it('skipped day produces a fixed slot with no candidates', () => {
    const days = simpleDays('2026-04-20', 1);
    days[0].skip = true;
    const slots = buildSlots(days, dishes, noLocked());
    expect(slots[0].fixed).toBe(true);
    expect(slots[0].candidates).toHaveLength(0);
  });

  it('locked meal produces a fixed slot with no candidates', () => {
    const days = simpleDays('2026-04-20', 1);
    const locked: Map<string, PlannedMeal> = new Map([
      ['2026-04-20', { date: '2026-04-20', dishId: 'kotlet', isLeftover: false, locked: true }],
    ]);
    const slots = buildSlots(days, dishes, locked);
    expect(slots[0].fixed).toBe(true);
    expect(slots[0].candidates).toHaveLength(0);
  });

  it('difficultyCap filters out dishes exceeding the cap', () => {
    const days = simpleDays('2026-04-20', 1);
    days[0].difficultyCap = 2; // only difficulty 1 and 2 pass
    const slots = buildSlots(days, dishes, noLocked());
    expect(slots[0].fixed).toBe(false);
    for (const d of slots[0].candidates) {
      expect(d.difficulty).toBeLessThanOrEqual(2);
    }
  });

  it('requiresTags filters out dishes missing required tag', () => {
    const days = simpleDays('2026-04-20', 1);
    days[0].difficultyCap = 5;
    days[0].requiresTags = ['nanny'];
    const slots = buildSlots(days, dishes, noLocked());
    for (const d of slots[0].candidates) {
      expect(d.tags).toContain('nanny');
    }
  });

  it('both difficultyCap and requiresTags must be satisfied', () => {
    const days = simpleDays('2026-04-20', 1);
    days[0].difficultyCap = 2;
    days[0].requiresTags = ['nanny'];
    const slots = buildSlots(days, dishes, noLocked());
    for (const d of slots[0].candidates) {
      expect(d.difficulty).toBeLessThanOrEqual(2);
      expect(d.tags).toContain('nanny');
    }
  });

  it('no matching dishes yields empty candidates', () => {
    const days = simpleDays('2026-04-20', 1);
    days[0].difficultyCap = 1;
    days[0].requiresTags = ['nanny'];
    // No dish has difficulty=1 AND tag 'nanny' — check fixtures:
    // pasta: difficulty=1, tags=[nanny] → this one passes!
    // Let's use an impossible combination instead
    days[0].difficultyCap = 1;
    days[0].requiresTags = ['nonexistent-tag'];
    const slots = buildSlots(days, dishes, noLocked());
    expect(slots[0].candidates).toHaveLength(0);
  });

  it('slot index and date are set correctly', () => {
    const days = simpleDays('2026-04-20', 3);
    const slots = buildSlots(days, dishes, noLocked());
    expect(slots[0].index).toBe(0);
    expect(slots[1].index).toBe(1);
    expect(slots[2].index).toBe(2);
    expect(slots[0].date).toBe('2026-04-20');
    expect(slots[1].date).toBe('2026-04-21');
  });
});

describe('randomChromosome', () => {
  it('fixed slots produce null genes', () => {
    const days = simpleDays('2026-04-20', 2);
    days[0].skip = true;
    const slots = buildSlots(days, dishes, noLocked());
    const rng = mulberry32(42);
    const chromo = randomChromosome(slots, rng);
    expect(chromo[0]).toBeNull();
  });

  it('non-fixed slots pick a candidate id', () => {
    const days = simpleDays('2026-04-20', 1);
    days[0].difficultyCap = 5;
    const slots = buildSlots(days, dishes, noLocked());
    const rng = mulberry32(42);
    const chromo = randomChromosome(slots, rng);
    const candidateIds = slots[0].candidates.map((d) => d.id);
    expect(candidateIds).toContain(chromo[0]);
  });

  it('all fixed slots produce all-null chromosome', () => {
    const days = simpleDays('2026-04-20', 3);
    days.forEach((d) => (d.skip = true));
    const slots = buildSlots(days, dishes, noLocked());
    const rng = mulberry32(42);
    const chromo = randomChromosome(slots, rng);
    expect(chromo.every((g) => g === null)).toBe(true);
  });
});
