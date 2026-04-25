import type { Dish } from '../../src/types/dish';
import type { DayContext } from '../../src/lib/days/capacity';

export const TAG_NANNY = 'nanny';

export const dishes: Dish[] = [
  { id: 'kotlet', name: 'Kotlet schabowy', meat: 'pork', difficulty: 3, preference: 5, tags: [], servesDays: 1 },
  { id: 'rosol',  name: 'Rosół', meat: 'poultry', difficulty: 2, preference: 4, tags: [TAG_NANNY], servesDays: 2 },
  { id: 'ryba',   name: 'Ryba z pieca', meat: 'fish', difficulty: 2, preference: 3, tags: [TAG_NANNY], servesDays: 1 },
  { id: 'pasta',  name: 'Makaron z sosem', meat: 'none', difficulty: 1, preference: 5, tags: [TAG_NANNY], servesDays: 1 },
  { id: 'gulasz', name: 'Gulasz wołowy', meat: 'beef', difficulty: 4, preference: 3, tags: [], servesDays: 2 },
  { id: 'kurczak', name: 'Pieczony kurczak', meat: 'poultry', difficulty: 3, preference: 5, tags: [], servesDays: 1 },
];

export function simpleDays(startISO: string, count: number): DayContext[] {
  const out: DayContext[] = [];
  const [y, m, d] = startISO.split('-').map(Number);
  for (let i = 0; i < count; i++) {
    const date = new Date(y, m - 1, d + i);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const isWe = date.getDay() === 0 || date.getDay() === 6;
    out.push({
      date: iso,
      isWeekend: isWe,
      difficultyCap: isWe ? 4 : 2,
      skip: false,
      requiresTags: [],
    });
  }
  return out;
}
