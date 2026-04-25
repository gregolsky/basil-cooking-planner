import type { PlannedMeal } from '../../types/plan';

/**
 * Returns meals from the source plan whose dates fall within [rangeStart, rangeEnd],
 * all marked as locked (pinned) for the new plan.
 */
export function buildLockedMealsForExtend(
  meals: PlannedMeal[],
  rangeStart: string,
  rangeEnd: string,
): PlannedMeal[] {
  return meals
    .filter((m) => m.date >= rangeStart && m.date <= rangeEnd)
    .map((m) => ({ ...m, locked: true }));
}

export interface ValidateExtendRangeResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates that [rangeStart, rangeEnd] is a non-empty range fully within
 * [planStart, planEnd].
 */
export function validateExtendRange(
  rangeStart: string,
  rangeEnd: string,
  planStart: string,
  planEnd: string,
): ValidateExtendRangeResult {
  if (
    rangeStart > rangeEnd ||
    rangeStart < planStart ||
    rangeEnd > planEnd
  ) {
    return { valid: false, error: 'extend.rangeOutOfBounds' };
  }
  return { valid: true };
}
