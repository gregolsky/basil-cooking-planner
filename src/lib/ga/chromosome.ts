import type { Dish } from '../../types/dish';
import type { DayContext } from '../days/capacity';
import type { Chromosome } from './types';
import type { Rng } from './rng';
import type { PlannedMeal } from '../../types/plan';

export interface Slot {
  index: number;
  date: string;
  fixed: boolean;
  candidates: Dish[];
}

export function buildSlots(
  days: DayContext[],
  dishes: Dish[],
  lockedMeals: Map<string, PlannedMeal>,
): Slot[] {
  return days.map((day, i) => {
    const locked = lockedMeals.get(day.date);
    const fixed = !!locked || day.skip;
    const candidates = fixed
      ? []
      : dishes.filter((d) => {
          if (d.difficulty > day.difficultyCap) return false;
          for (const req of day.requiresTags) {
            if (!d.tags.includes(req)) return false;
          }
          return true;
        });
    return { index: i, date: day.date, fixed, candidates };
  });
}

export function randomChromosome(slots: Slot[], rng: Rng): Chromosome {
  return slots.map((slot) => {
    if (slot.fixed) return null;
    if (slot.candidates.length === 0) return null;
    return rng.pick(slot.candidates).id;
  });
}
