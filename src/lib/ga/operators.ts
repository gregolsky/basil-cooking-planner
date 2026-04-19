import type { Chromosome } from './types';
import type { Slot } from './chromosome';
import type { Rng } from './rng';

export interface ScoredChromosome {
  chromo: Chromosome;
  fitness: number;
}

export function tournamentSelect(
  pop: ScoredChromosome[],
  k: number,
  rng: Rng,
): ScoredChromosome {
  let best: ScoredChromosome | null = null;
  for (let i = 0; i < k; i++) {
    const c = pop[rng.int(pop.length)];
    if (!best || c.fitness > best.fitness) best = c;
  }
  return best!;
}

export function uniformCrossover(
  a: Chromosome,
  b: Chromosome,
  slots: Slot[],
  rng: Rng,
): Chromosome {
  return slots.map((slot, i) => {
    if (slot.fixed) return null;
    return rng.next() < 0.5 ? a[i] : b[i];
  });
}

export function mutate(
  chromo: Chromosome,
  slots: Slot[],
  rate: number,
  rng: Rng,
): Chromosome {
  return chromo.map((gene, i) => {
    const slot = slots[i];
    if (slot.fixed) return null;
    if (rng.next() < rate && slot.candidates.length > 0) {
      return rng.pick(slot.candidates).id;
    }
    return gene;
  });
}
