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
    difficultyCap: Math.max(1, cap),
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
