import type { Plan, PlannedMeal } from '../../types/plan';

/** Meals that must not be touched during regeneration: explicitly locked or already in the past. */
export function getLockedMealsForRegen(meals: PlannedMeal[], today: string): PlannedMeal[] {
  return meals.filter((m) => m.locked || m.date < today);
}

/** True when the entire plan has already passed (endDate is before today). */
export function isPlanFullyInPast(plan: Plan, today: string): boolean {
  return plan.endDate < today;
}
