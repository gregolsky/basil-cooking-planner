import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Plan, PlannedMeal } from '../types/plan';
import { useAppStore } from '../store/useAppStore';
import { buildDayContexts, type DayContext } from '../lib/days/capacity';
import { fromISODate, calendarDayLabels, formatMonthLocale, toISODate } from '../lib/utils/date';
import { splitByPast } from '../lib/plan/pastDays';
import { DayCard } from './DayCard';
import { DayEditor } from './DayEditor';

interface Props {
  plan: Plan;
}

interface Entry {
  date: string;
  meal: PlannedMeal;
  day: DayContext;
}

export function Calendar({ plan }: Props) {
  const { t, i18n } = useTranslation();
  const dishes = useAppStore((s) => s.dishes);
  const tagDefs = useAppStore((s) => s.tagDefinitions);
  const weekStartDay = useAppStore((s) => s.weekStartDay);
  const replaceMeal = useAppStore((s) => s.replaceMeal);
  const dishMap = useMemo(() => new Map(dishes.map((d) => [d.id, d])), [dishes]);
  const tagMap = useMemo(() => new Map(tagDefs.map((t) => [t.id, t])), [tagDefs]);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);

  const days = useMemo(
    () => buildDayContexts(plan.meals.map((m) => m.date), plan.dayModifiers ?? []),
    [plan.meals, plan.dayModifiers],
  );

  const today = toISODate(new Date());
  const entries: Entry[] = useMemo(
    () => plan.meals.map((meal, i) => ({ date: meal.date, meal, day: days[i] })),
    [plan.meals, days],
  );
  const { past, upcoming } = useMemo(() => splitByPast(entries, today), [entries, today]);
  const allInPast = upcoming.length === 0;

  const togglePin = (meal: PlannedMeal) => {
    replaceMeal(plan.id, meal.date, { ...meal, locked: !meal.locked });
  };

  const labels = calendarDayLabels(i18n.language, weekStartDay);

  function renderGrid(list: Entry[], opts: { past: boolean; gridExtraClass?: string }) {
    if (list.length === 0) return null;
    const firstDow = fromISODate(list[0].meal.date).getDay();
    const padding = (firstDow - weekStartDay + 7) % 7;

    return (
      <div className={['calendar-grid', opts.gridExtraClass].filter(Boolean).join(' ')}>
        {labels.map((l) => (
          <div key={l} className="calendar-day-label" style={{ textAlign: 'center', fontWeight: 700, fontSize: 12, color: 'var(--color-ink)', opacity: 0.6, padding: '2px 0' }}>{l}</div>
        ))}
        {Array.from({ length: padding }, (_, i) => (
          <div key={`pad-${i}`} className="calendar-pad" />
        ))}
        {list.map(({ meal, day }) => {
          const dish = meal.dishId ? dishMap.get(meal.dishId) ?? null : null;
          // No `i > 0` guard: each grid (past/upcoming) can independently start
          // on the 1st of a month once past days are collapsed by default.
          const isMonthStart = meal.date.slice(8) === '01';
          const monthPadding = isMonthStart
            ? (fromISODate(meal.date).getDay() - weekStartDay + 7) % 7
            : 0;
          return [
            isMonthStart && (
              <div key={`month-${meal.date}`} className="calendar-month-banner">
                {formatMonthLocale(meal.date, i18n.language)}
              </div>
            ),
            ...Array.from({ length: monthPadding }, (_, p) => (
              <div key={`mpad-${meal.date}-${p}`} className="calendar-pad" />
            )),
            <DayCard
              key={meal.date}
              meal={meal}
              day={day}
              dish={dish}
              tagMap={tagMap}
              monthStart={isMonthStart}
              isPast={opts.past}
              onClick={() => setEditingDate(meal.date)}
              onTogglePin={() => togglePin(meal)}
            />,
          ];
        })}
      </div>
    );
  }

  return (
    <>
      {!allInPast && past.length > 0 && (
        <div className="row no-print" style={{ marginBottom: 10 }}>
          <button type="button" className="link-btn" onClick={() => setShowPast((v) => !v)}>
            {showPast ? t('calendar.hidePast') : t('calendar.showPast', { count: past.length })}
            <span className={showPast ? 'chevron open' : 'chevron'}>»</span>
          </button>
        </div>
      )}

      {!allInPast && showPast && renderGrid(past, { past: true, gridExtraClass: 'no-print' })}

      {renderGrid(allInPast ? entries : upcoming, { past: allInPast })}

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
