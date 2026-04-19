import type { Dish } from '../../types/dish';
import type { PlannedMeal } from '../../types/plan';
import type { DayContext } from '../days/capacity';
import type { Chromosome, GAConfig, GAProgress, DecodedPlan } from './types';
import { DEFAULT_GA_CONFIG } from './types';
import { mulberry32 } from './rng';
import { buildSlots, randomChromosome } from './chromosome';
import { tournamentSelect, uniformCrossover, mutate } from './operators';
import type { ScoredChromosome } from './operators';
import { decode } from './decoder';
import { evaluate } from './fitness';

export interface RunGAInput {
  dishes: Dish[];
  days: DayContext[];
  lockedMeals: PlannedMeal[];
  config?: Partial<GAConfig>;
}

export interface RunGAOptions {
  onProgress?: (p: GAProgress) => void;
  shouldAbort?: () => boolean;
}

export function runGA(input: RunGAInput, options: RunGAOptions = {}): DecodedPlan {
  const config: GAConfig = { ...DEFAULT_GA_CONFIG, ...input.config };
  const seed = config.seed ?? Math.floor(Math.random() * 0xffffffff);
  const rng = mulberry32(seed);

  const dishMap = new Map(input.dishes.map((d) => [d.id, d]));
  const lockedMap = new Map(input.lockedMeals.map((m) => [m.date, m]));
  const slots = buildSlots(input.days, input.dishes, lockedMap);

  const scorer = (chromo: Chromosome): ScoredChromosome => {
    const meals = decode(chromo, { days: input.days, dishMap, lockedMeals: lockedMap });
    const { score } = evaluate({ meals, days: input.days, dishMap });
    return { chromo, fitness: score };
  };

  let pop: ScoredChromosome[] = [];
  for (let i = 0; i < config.populationSize; i++) {
    pop.push(scorer(randomChromosome(slots, rng)));
  }
  pop.sort((a, b) => b.fitness - a.fitness);

  let best = pop[0];
  let bestGen = 0;

  for (let gen = 0; gen < config.generations; gen++) {
    if (options.shouldAbort?.()) break;

    const nextPop: ScoredChromosome[] = [];
    for (let e = 0; e < config.eliteCount && e < pop.length; e++) {
      nextPop.push(pop[e]);
    }

    while (nextPop.length < config.populationSize) {
      const p1 = tournamentSelect(pop, config.tournamentK, rng);
      const p2 = tournamentSelect(pop, config.tournamentK, rng);
      let child = uniformCrossover(p1.chromo, p2.chromo, slots, rng);
      child = mutate(child, slots, config.mutationRate, rng);
      nextPop.push(scorer(child));
    }

    pop = nextPop;
    pop.sort((a, b) => b.fitness - a.fitness);

    if (pop[0].fitness > best.fitness) {
      best = pop[0];
      bestGen = gen;
    }

    options.onProgress?.({
      generation: gen + 1,
      bestFitness: best.fitness,
      totalGenerations: config.generations,
    });

    if (gen - bestGen >= config.earlyStopGenerations) break;
  }

  const meals = decode(best.chromo, { days: input.days, dishMap, lockedMeals: lockedMap });
  const { score, violations } = evaluate({ meals, days: input.days, dishMap });
  return { meals, fitness: score, violations };
}
