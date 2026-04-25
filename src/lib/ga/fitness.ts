import type { Dish, MeatType } from '../../types/dish';
import { MEAT_LABELS } from '../../types/dish';
import type { PlannedMeal, Violation } from '../../types/plan';
import type { DayContext } from '../days/capacity';
import type { CumulativeLimit } from '../../types/day';
import type { TagDefinition } from '../../types/tag';
import { formatShortPl, weekdayShortPl, fromISODate, daysBetween } from '../utils/date';

export interface FitnessWeights {
  sameMeatPenalty: number;
  difficultyOverrunPenalty: number;
  tagRequirementPenalty: number;
  tagWeekLimitPenalty: number;
  tagGapPenalty: number;
  preferenceReward: number;
  dishRepeatPenalty: number;
  meatDiversityReward: number;
  slowWeekdayPenalty: number;
  cumulativeLimitPenalty: number;
}

export const DEFAULT_WEIGHTS: FitnessWeights = {
  sameMeatPenalty: 1000,
  difficultyOverrunPenalty: 500,
  tagRequirementPenalty: 800,
  tagWeekLimitPenalty: 300,
  tagGapPenalty: 400,
  preferenceReward: 10,
  dishRepeatPenalty: 40,
  meatDiversityReward: 20,
  slowWeekdayPenalty: 20,
  cumulativeLimitPenalty: 600,
};

export interface EvaluateArgs {
  meals: PlannedMeal[];
  days: DayContext[];
  dishMap: Map<string, Dish>;
  tagDefs?: TagDefinition[];
  cumulativeLimits?: CumulativeLimit[];
  weights?: Partial<FitnessWeights>;
}

export interface EvaluateResult {
  score: number;
  violations: Violation[];
}

function tag(iso: string): string {
  return `${formatShortPl(iso)} (${weekdayShortPl(iso)})`;
}

function isoWeek(iso: string): string {
  const d = fromISODate(iso);
  const day = d.getDay() || 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + 1);
  return `${monday.getFullYear()}-${monday.getMonth()}-${monday.getDate()}`;
}

export function evaluate({ meals, days, dishMap, tagDefs = [], cumulativeLimits = [], weights }: EvaluateArgs): EvaluateResult {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  const violations: Violation[] = [];
  let score = 0;

  let prevMeat: MeatType | null = null;

  const dishCounts = new Map<string, number>();
  const tagsByWeek = new Map<string, Map<string, number>>();
  const tagLastSeen = new Map<string, string>();
  const tagMap = new Map(tagDefs.map((t) => [t.id, t]));

  for (let i = 0; i < meals.length; i++) {
    const meal = meals[i];
    const day = days[i];
    if (!meal.dishId) {
      prevMeat = null;
      continue;
    }
    const dish = dishMap.get(meal.dishId);
    if (!dish) continue;

    if (!meal.isLeftover) {
      if (prevMeat && dish.meat === prevMeat && dish.meat !== 'none') {
        score -= w.sameMeatPenalty;
        violations.push({
          date: day.date,
          severity: 'hard',
          kind: 'same_meat',
          message: `${tag(day.date)} — to samo mięso co poprzedniego dnia (${MEAT_LABELS[dish.meat]})`,
        });
      }

      if (dish.difficulty > day.difficultyCap) {
        score -= w.difficultyOverrunPenalty;
        violations.push({
          date: day.date,
          severity: 'hard',
          kind: 'difficulty_overrun',
          message: `${tag(day.date)} — trudność dania (${dish.difficulty}) przekracza limit dnia (${day.difficultyCap})`,
        });
      }

      for (const req of day.requiresTags) {
        if (!dish.tags.includes(req)) {
          score -= w.tagRequirementPenalty;
          const def = tagMap.get(req);
          violations.push({
            date: day.date,
            severity: 'hard',
            kind: 'tag_required',
            message: `${tag(day.date)} — brakuje wymaganej etykiety „${def?.name ?? req}”`,
          });
        }
      }

      const weekKey = isoWeek(day.date);
      if (!tagsByWeek.has(weekKey)) tagsByWeek.set(weekKey, new Map());
      const weekTags = tagsByWeek.get(weekKey)!;
      for (const t of dish.tags) {
        weekTags.set(t, (weekTags.get(t) ?? 0) + 1);

        const def = tagMap.get(t);
        if (def?.minGapDays !== undefined) {
          const prev = tagLastSeen.get(t);
          if (prev) {
            const gap = daysBetween(prev, day.date);
            if (gap < def.minGapDays) {
              score -= w.tagGapPenalty;
              violations.push({
                date: day.date,
                severity: 'hard',
                kind: 'tag_gap',
                message: `${tag(day.date)} — „${def.name}” za wcześnie (${gap} dni od poprzedniego, wymagane ${def.minGapDays})`,
              });
            }
          }
          tagLastSeen.set(t, day.date);
        }
      }

      score += dish.preference * w.preferenceReward;

      const repeats = (dishCounts.get(dish.id) ?? 0);
      if (repeats > 0) {
        score -= w.dishRepeatPenalty * repeats;
      }
      dishCounts.set(dish.id, repeats + 1);

      if (dish.difficulty > day.difficultyCap) {
        score -= w.slowWeekdayPenalty;
      }
    } else {
      violations.push({
        date: day.date,
        severity: 'info',
        kind: 'leftover',
        message: `${tag(day.date)} — resztki (${dish.name})`,
      });
    }

    prevMeat = dish.meat;
  }

  for (const [week, tagCounts] of tagsByWeek) {
    for (const [tagId, count] of tagCounts) {
      const def = tagMap.get(tagId);
      if (def?.maxPerWeek !== undefined && count > def.maxPerWeek) {
        const excess = count - def.maxPerWeek;
        score -= w.tagWeekLimitPenalty * excess;
        violations.push({
          date: week,
          severity: 'hard',
          kind: 'tag_week_limit',
          message: `Etykieta „${def.name}” użyta ${count}× w tygodniu (limit: ${def.maxPerWeek})`,
        });
      }
    }
  }

  for (const limit of cumulativeLimits) {
    let totalDifficulty = 0;
    for (let i = 0; i < meals.length; i++) {
      const meal = meals[i];
      const day = days[i];
      if (meal.isLeftover || !meal.dishId) continue;
      if (day.date < limit.startDate || day.date > limit.endDate) continue;
      const dish = dishMap.get(meal.dishId);
      if (dish) totalDifficulty += dish.difficulty;
    }
    if (totalDifficulty > limit.maxTotal) {
      const excess = totalDifficulty - limit.maxTotal;
      score -= w.cumulativeLimitPenalty * excess;
      violations.push({
        date: limit.startDate,
        severity: 'hard',
        kind: 'cumulative_limit',
        message: `Sumaryczna trudność ${totalDifficulty} w dniach ${formatShortPl(limit.startDate)}–${formatShortPl(limit.endDate)} przekracza limit (${limit.maxTotal})`,
      });
    }
  }

  const meatCounts = new Map<MeatType, number>();
  let totalWithMeat = 0;
  for (const meal of meals) {
    if (!meal.dishId || meal.isLeftover) continue;
    const dish = dishMap.get(meal.dishId);
    if (!dish) continue;
    meatCounts.set(dish.meat, (meatCounts.get(dish.meat) ?? 0) + 1);
    totalWithMeat += 1;
  }
  if (totalWithMeat > 0) {
    let entropy = 0;
    for (const c of meatCounts.values()) {
      const p = c / totalWithMeat;
      entropy -= p * Math.log2(p);
    }
    score += entropy * w.meatDiversityReward;
  }

  for (const [dishId, count] of dishCounts) {
    if (count > 1) {
      const dish = dishMap.get(dishId);
      if (dish) {
        violations.push({
          date: '',
          severity: 'soft',
          kind: 'dish_repeat',
          message: `Powtórzenie dania: ${dish.name} (${count}×)`,
        });
      }
    }
  }

  return { score, violations };
}
