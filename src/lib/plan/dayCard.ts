import type { PlannedMeal } from '../../types/plan';
import type { DayContext } from '../days/capacity';

/** A day can't be pinned/unpinned when there's no dish to lock, it's a leftover, skipped, or already past. */
export function isPinDisabled(meal: PlannedMeal, day: DayContext, isPast: boolean): boolean {
  return !meal.dishId || meal.isLeftover || day.skip || isPast;
}

/**
 * Difficulty to show against the day's cap. Leftovers aren't checked against the cap by
 * the GA (see fitness.ts), so nothing is "cooked" that day — always 0 for a leftover meal.
 */
export function cookedDifficulty(meal: PlannedMeal, dishDifficulty: number | undefined): number {
  if (meal.isLeftover) return 0;
  return dishDifficulty ?? 0;
}
