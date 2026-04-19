import type { Plan, Violation } from '../../types/plan';
import type { Dish } from '../../types/dish';
import type { DayModifier } from '../../types/day';
import type { TagDefinition } from '../../types/tag';
import { buildDayContexts } from '../days/capacity';
import { evaluate } from '../ga/fitness';

export interface EvaluatedPlan {
  fitness: number;
  violations: Violation[];
}

export function evaluatePlan(
  plan: Plan,
  dishes: Dish[],
  dayModifiers: DayModifier[],
  tagDefs: TagDefinition[] = [],
): EvaluatedPlan {
  const dishMap = new Map(dishes.map((d) => [d.id, d]));
  const days = buildDayContexts(plan.meals.map((m) => m.date), dayModifiers);
  const { score, violations } = evaluate({ meals: plan.meals, days, dishMap, tagDefs });
  return { fitness: score, violations };
}
