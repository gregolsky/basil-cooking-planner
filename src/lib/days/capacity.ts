import type { DayModifier } from '../../types/day';
import { isWeekend } from '../utils/date';

export interface DayContext {
  date: string;
  difficultyCap: number;
  skip: boolean;
  requiresTags: string[];
  note?: string;
}

const WEEKDAY_BASE = 3;
const WEEKEND_BASE = 5;
// Dish.difficulty tops out at 5 (see src/types/dish.ts), so a cap above that is
// meaningless — clamping also keeps difficultyCap safe to use as a DOM segment
// count (e.g. DifficultyBar) even from an unvalidated JSON import.
const MAX_DIFFICULTY = 5;

export function computeDayContext(
  date: string,
  modifiers: Map<string, DayModifier>,
): DayContext {
  const mod = modifiers.get(date);
  const weekend = isWeekend(date);
  let cap = weekend ? WEEKEND_BASE : WEEKDAY_BASE;
  if (mod?.difficultyCap !== undefined) cap = mod.difficultyCap;
  return {
    date,
    difficultyCap: Math.min(MAX_DIFFICULTY, Math.max(1, cap)),
    skip: mod?.skip ?? false,
    requiresTags: mod?.requiresTags ?? [],
    note: mod?.note,
  };
}

export function buildDayContexts(
  dates: string[],
  modifiers: DayModifier[],
): DayContext[] {
  const map = new Map(modifiers.map((m) => [m.date, m]));
  return dates.map((d) => computeDayContext(d, map));
}
