import type { Plan } from '../../types/plan';
import type { Dish } from '../../types/dish';
import { MEAT_LABELS } from '../../types/dish';
import { formatPl, weekdayPl } from '../utils/date';

export function planToCsv(plan: Plan, dishMap: Map<string, Dish>): string {
  const header = ['data', 'dzień', 'danie', 'mięso', 'trudność', 'etykiety', 'leftover', 'przypięte'];
  const rows = plan.meals.map((m) => {
    const dish = m.dishId ? dishMap.get(m.dishId) : null;
    return [
      formatPl(m.date),
      weekdayPl(m.date),
      dish?.name ?? '(nie gotujemy)',
      dish ? MEAT_LABELS[dish.meat] : '',
      dish ? String(dish.difficulty) : '',
      dish ? dish.tags.join(', ') : '',
      m.isLeftover ? 'tak' : 'nie',
      m.locked ? 'tak' : 'nie',
    ];
  });

  const escape = (v: string) => {
    if (v.includes(';') || v.includes('"') || v.includes('\n')) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };

  const bom = '\uFEFF';
  const lines = [header, ...rows].map((r) => r.map(escape).join(';'));
  return bom + lines.join('\r\n');
}
