import { useMemo, useState } from 'react';
import type { Plan } from '../types/plan';
import { useAppStore } from '../store/useAppStore';
import { buildDayContexts } from '../lib/days/capacity';
import { fromISODate } from '../lib/utils/date';
import { DayCard } from './DayCard';
import { DayEditor } from './DayEditor';

const DAY_LABELS_MON = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];
const DAY_LABELS_SUN = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];

interface Props {
  plan: Plan;
}

export function Calendar({ plan }: Props) {
  const dishes = useAppStore((s) => s.dishes);
  const dayModifiers = useAppStore((s) => s.dayModifiers);
  const tagDefs = useAppStore((s) => s.tagDefinitions);
  const weekStartDay = useAppStore((s) => s.weekStartDay);
  const dishMap = useMemo(() => new Map(dishes.map((d) => [d.id, d])), [dishes]);
  const tagMap = useMemo(() => new Map(tagDefs.map((t) => [t.id, t])), [tagDefs]);
  const [editingDate, setEditingDate] = useState<string | null>(null);

  const dates = plan.meals.map((m) => m.date);
  const days = useMemo(() => buildDayContexts(dates, dayModifiers), [dates, dayModifiers]);

  const labels = weekStartDay === 1 ? DAY_LABELS_MON : DAY_LABELS_SUN;
  const firstDow = fromISODate(plan.startDate).getDay(); // 0=Sun
  const padding = (firstDow - weekStartDay + 7) % 7;

  return (
    <>
      <div className="calendar-grid">
        {labels.map((l) => (
          <div key={l} style={{ textAlign: 'center', fontWeight: 700, fontSize: 12, color: 'var(--color-ink)', opacity: 0.6, padding: '2px 0' }}>{l}</div>
        ))}
        {Array.from({ length: padding }, (_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {plan.meals.map((meal, i) => {
          const day = days[i];
          const dish = meal.dishId ? dishMap.get(meal.dishId) ?? null : null;
          return (
            <DayCard
              key={meal.date}
              meal={meal}
              day={day}
              dish={dish}
              tagMap={tagMap}
              onClick={() => setEditingDate(meal.date)}
            />
          );
        })}
      </div>

      {editingDate && (
        <DayEditor
          planId={plan.id}
          date={editingDate}
          onClose={() => setEditingDate(null)}
        />
      )}
    </>
  );
}
