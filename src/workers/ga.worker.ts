import * as Comlink from 'comlink';
import { runGA } from '../lib/ga/algorithm';
import type { Dish } from '../types/dish';
import type { PlannedMeal } from '../types/plan';
import type { DayContext } from '../lib/days/capacity';
import type { CumulativeLimit } from '../types/day';
import type { TagDefinition } from '../types/tag';
import type { GAConfig, GAProgress, DecodedPlan } from '../lib/ga/types';
import type { FitnessWeights } from '../lib/ga/fitness';

interface RunArgs {
  dishes: Dish[];
  days: DayContext[];
  lockedMeals: PlannedMeal[];
  config?: Partial<GAConfig>;
  cumulativeLimits?: CumulativeLimit[];
  tagDefs?: TagDefinition[];
  weights?: Partial<FitnessWeights>;
}

let aborted = false;

const api = {
  run(args: RunArgs, onProgress: (p: GAProgress) => void): DecodedPlan {
    aborted = false;
    return runGA(
      { dishes: args.dishes, days: args.days, lockedMeals: args.lockedMeals, config: args.config, cumulativeLimits: args.cumulativeLimits, tagDefs: args.tagDefs, weights: args.weights },
      {
        onProgress: (p) => onProgress(p),
        shouldAbort: () => aborted,
      },
    );
  },
  abort() {
    aborted = true;
  },
};

Comlink.expose(api);

export type GAWorkerApi = typeof api;
