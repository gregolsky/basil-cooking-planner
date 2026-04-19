import type { DayModifier } from '../../types/day';
import { isWeekend, addDays } from '../utils/date';

export interface DayContext {
  date: string;
  isWeekend: boolean;
  wifeDuty: boolean;
  difficultyCap: number;
  skip: boolean;
  requiresTags: string[];
  note?: string;
}

const WEEKDAY_BASE = 2;
const WEEKEND_BASE = 4;

export function computeDayContext(
  date: string,
  modifiers: Map<string, DayModifier>,
): DayContext {
  const mod = modifiers.get(date);
  const nextMod = modifiers.get(addDays(date, 1));
  const weekend = isWeekend(date);
  let cap = weekend ? WEEKEND_BASE : WEEKDAY_BASE;
  if (mod?.wifeDuty) cap -= 1;
  if (nextMod?.wifeDuty) cap -= 1;
  if (mod?.difficultyCap !== undefined) cap = mod.difficultyCap;
  return {
    date,
    isWeekend: weekend,
    wifeDuty: mod?.wifeDuty ?? false,
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
