import { useMemo, useState } from 'react';
import type { Plan } from '../types/plan';
import { useAppStore } from '../store/useAppStore';
import { buildDayContexts } from '../lib/days/capacity';
import { DayCard } from './DayCard';
import { DayEditor } from './DayEditor';

interface Props {
  plan: Plan;
}

export function Calendar({ plan }: Props) {
  const dishes = useAppStore((s) => s.dishes);
  const dayModifiers = useAppStore((s) => s.dayModifiers);
  const tagDefs = useAppStore((s) => s.tagDefinitions);
  const dishMap = useMemo(() => new Map(dishes.map((d) => [d.id, d])), [dishes]);
  const tagMap = useMemo(() => new Map(tagDefs.map((t) => [t.id, t])), [tagDefs]);
  const [editingDate, setEditingDate] = useState<string | null>(null);

  const dates = plan.meals.map((m) => m.date);
  const days = useMemo(() => buildDayContexts(dates, dayModifiers), [dates, dayModifiers]);

  return (
    <>
      <div className="calendar-grid">
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
