import type { PlannedMeal, Violation } from '../../types/plan';
import type { Dish } from '../../types/dish';

export type PlanQualityTier = 'perfect' | 'great' | 'good' | 'could-be-better';

export interface PlanQualityInput {
  meals: PlannedMeal[];
  violations: Violation[];
  dishMap: Map<string, Dish>;
}

/**
 * Buckets a plan into a human-readable quality tier based on average family
 * preference across cooked meals. Returns null when the plan still has hard
 * violations — those are already surfaced by the violations count badge, so
 * a quality read isn't meaningful until they're resolved.
 */
export function computePlanQuality({ meals, violations, dishMap }: PlanQualityInput): PlanQualityTier | null {
  if (violations.some((v) => v.severity === 'hard')) return null;

  const prefs: number[] = [];
  for (const meal of meals) {
    if (meal.isLeftover || !meal.dishId) continue;
    const dish = dishMap.get(meal.dishId);
    if (dish) prefs.push(dish.preference);
  }
  if (prefs.length === 0) return null;

  const avg = prefs.reduce((a, b) => a + b, 0) / prefs.length;
  if (avg >= 4.5) return 'perfect';
  if (avg >= 3.5) return 'great';
  if (avg >= 2.5) return 'good';
  return 'could-be-better';
}
