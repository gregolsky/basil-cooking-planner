import * as Comlink from 'comlink';
import type { Dish } from '../../types/dish';
import type { PlannedMeal } from '../../types/plan';
import type { DayContext } from '../days/capacity';
import type { GAConfig, GAProgress, DecodedPlan } from './types';
import type { GAWorkerApi } from '../../workers/ga.worker';

export interface RunInWorkerArgs {
  dishes: Dish[];
  days: DayContext[];
  lockedMeals: PlannedMeal[];
  config?: Partial<GAConfig>;
  onProgress?: (p: GAProgress) => void;
}

export interface RunHandle {
  promise: Promise<DecodedPlan>;
  abort: () => void;
}

export function runGAInWorker(args: RunInWorkerArgs): RunHandle {
  const worker = new Worker(new URL('../../workers/ga.worker.ts', import.meta.url), {
    type: 'module',
  });
  const api = Comlink.wrap<GAWorkerApi>(worker);

  const progressProxy = Comlink.proxy((p: GAProgress) => {
    args.onProgress?.(p);
  });

  const promise = api
    .run(
      {
        dishes: args.dishes,
        days: args.days,
        lockedMeals: args.lockedMeals,
        config: args.config,
      },
      progressProxy,
    )
    .finally(() => {
      setTimeout(() => worker.terminate(), 50);
    });

  return {
    promise: promise as Promise<DecodedPlan>,
    abort: () => {
      api.abort();
    },
  };
}
