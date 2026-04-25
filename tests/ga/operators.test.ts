import { describe, it, expect } from 'vitest';
import { tournamentSelect, uniformCrossover, mutate } from '../../src/lib/ga/operators';
import { mulberry32 } from '../../src/lib/ga/rng';
import { buildSlots } from '../../src/lib/ga/chromosome';
import { dishes, simpleDays } from './fixtures';
import type { ScoredChromosome } from '../../src/lib/ga/operators';

function makePopulation(fitnesses: number[]): ScoredChromosome[] {
  return fitnesses.map((f, i) => ({ chromo: [`dish-${i}`], fitness: f }));
}

describe('tournamentSelect', () => {
  it('with k=population size always picks the best', () => {
    const pop = makePopulation([10, 50, 30, 80, 20]);
    const rng = mulberry32(42);
    const winner = tournamentSelect(pop, pop.length, rng);
    expect(winner.fitness).toBe(80);
  });

  it('with k=1 picks a random individual', () => {
    const pop = makePopulation([1, 2, 3, 4, 5]);
    const rng = mulberry32(42);
    // With k=1 the tournament is one random pick — just verify it returns a valid member
    const winner = tournamentSelect(pop, 1, rng);
    expect(pop).toContain(winner);
  });
});

describe('uniformCrossover', () => {
  it('fixed slots always produce null regardless of parent genes', () => {
    const days = simpleDays('2026-04-20', 3);
    days[1].skip = true;
    const slots = buildSlots(days, dishes, new Map());
    const a = ['kotlet', 'rosol', 'ryba'];
    const b = ['pasta', 'gulasz', 'kurczak'];
    const rng = mulberry32(42);
    const child = uniformCrossover(a, b, slots, rng);
    expect(child[1]).toBeNull();
  });

  it('non-fixed genes come from either parent a or parent b', () => {
    const days = simpleDays('2026-04-20', 3);
    days.forEach((d) => { d.difficultyCap = 5; });
    const slots = buildSlots(days, dishes, new Map());
    const a = ['kotlet', 'rosol', 'ryba'];
    const b = ['pasta', 'gulasz', 'kurczak'];
    const rng = mulberry32(42);
    const child = uniformCrossover(a, b, slots, rng);
    for (let i = 0; i < child.length; i++) {
      if (!slots[i].fixed) {
        expect([a[i], b[i]]).toContain(child[i]);
      }
    }
  });
});

describe('mutate', () => {
  it('rate=0 leaves non-fixed genes unchanged', () => {
    const days = simpleDays('2026-04-20', 3);
    days.forEach((d) => { d.difficultyCap = 5; });
    const slots = buildSlots(days, dishes, new Map());
    const original = ['kotlet', 'rosol', 'ryba'];
    const rng = mulberry32(42);
    const result = mutate(original, slots, 0, rng);
    expect(result).toEqual(original);
  });

  it('rate=1 mutates all non-fixed slots to a candidate', () => {
    const days = simpleDays('2026-04-20', 3);
    days.forEach((d) => { d.difficultyCap = 5; });
    const slots = buildSlots(days, dishes, new Map());
    const original = ['kotlet', 'kotlet', 'kotlet'];
    const rng = mulberry32(42);
    const result = mutate(original, slots, 1, rng);
    for (let i = 0; i < result.length; i++) {
      if (!slots[i].fixed) {
        const candidateIds = slots[i].candidates.map((d) => d.id);
        expect(candidateIds).toContain(result[i]);
      }
    }
  });

  it('fixed slots always produce null regardless of rate', () => {
    const days = simpleDays('2026-04-20', 3);
    days[1].skip = true;
    const slots = buildSlots(days, dishes, new Map());
    const original = ['kotlet', 'rosol', 'ryba'];
    const rng = mulberry32(42);
    const result = mutate(original, slots, 1, rng);
    expect(result[1]).toBeNull();
  });

  it('slot with empty candidates stays as-is even at rate=1', () => {
    const days = simpleDays('2026-04-20', 1);
    days[0].difficultyCap = 1;
    days[0].requiresTags = ['nonexistent'];
    const slots = buildSlots(days, dishes, new Map());
    const original = [null];
    const rng = mulberry32(42);
    const result = mutate(original, slots, 1, rng);
    expect(result[0]).toBeNull();
  });
});
