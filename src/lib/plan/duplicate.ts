import type { Plan } from '../../types/plan';
import { uid } from '../utils/id';

export function duplicatePlanData(plan: Plan, suffix: string): Plan {
  return {
    ...plan,
    id: uid(),
    name: (plan.name ?? 'Plan') + ' ' + suffix,
    createdAt: new Date().toISOString(),
    meals: plan.meals.map((m) => ({ ...m })),
    violations: plan.violations.map((v) => ({ ...v })),
    dayModifiers: (plan.dayModifiers ?? []).map((m) => ({
      ...m,
      requiresTags: m.requiresTags ? [...m.requiresTags] : undefined,
    })),
    cumulativeLimits: (plan.cumulativeLimits ?? []).map((l) => ({ ...l })),
  };
}
