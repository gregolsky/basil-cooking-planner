import type { Dish } from '../../types/dish';
import type { PlannedMeal, Violation } from '../../types/plan';
import type { DayContext } from '../days/capacity';

export type Chromosome = (string | null)[];

export interface GAConfig {
  populationSize: number;
  generations: number;
  mutationRate: number;
  eliteCount: number;
  tournamentK: number;
  earlyStopGenerations: number;
  seed?: number;
}

export const DEFAULT_GA_CONFIG: GAConfig = {
  populationSize: 80,
  generations: 200,
  mutationRate: 0.05,
  eliteCount: 2,
  tournamentK: 3,
  earlyStopGenerations: 30,
};

export interface GAInput {
  dishes: Dish[];
  days: DayContext[];
  lockedMeals: Map<string, PlannedMeal>;
  config?: Partial<GAConfig>;
}

export interface DecodedPlan {
  meals: PlannedMeal[];
  fitness: number;
  violations: Violation[];
}

export interface GAProgress {
  generation: number;
  bestFitness: number;
  totalGenerations: number;
}
