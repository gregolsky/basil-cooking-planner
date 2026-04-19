import type { PlannedMeal } from '../types/plan';
import type { Dish } from '../types/dish';
import type { DayContext } from '../lib/days/capacity';
import type { TagDefinition } from '../types/tag';
import { formatShortPl, weekdayShortPl, isWeekend } from '../lib/utils/date';

interface Props {
  meal: PlannedMeal;
  day: DayContext;
  dish: Dish | null;
  tagMap: Map<string, TagDefinition>;
  onClick: () => void;
}

export function DayCard({ meal, day, dish, tagMap, onClick }: Props) {
  const weekend = isWeekend(day.date);
  const classes = [
    'menu-card',
    'day-card',
    weekend ? 'weekend' : '',
    day.skip ? 'skip' : '',
    meal.locked ? 'locked' : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={classes}
      onClick={onClick}
      style={{ textAlign: 'left', cursor: 'pointer' }}
    >
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <div className="day-weekday">{weekdayShortPl(day.date)}</div>
          <div className="day-date">{formatShortPl(day.date)}</div>
        </div>
        <div className="day-meta">
          {meal.locked && <span className="badge">📌</span>}
          {meal.isLeftover && <span className="badge soft">resztki</span>}
          {day.wifeDuty && <span className="badge">dyżur</span>}
          {day.requiresTags.map((t) => (
            <span key={t} className="badge gold">{tagMap.get(t)?.name ?? t}</span>
          ))}
        </div>
      </div>
      <div className="day-dish">
        {day.skip
          ? <span className="muted">(nie gotujemy)</span>
          : dish
            ? dish.name
            : <span className="muted">—</span>}
      </div>
      {dish && !meal.isLeftover && (
        <div className="muted" style={{ fontSize: 12 }}>
          trudność {dish.difficulty} · {dish.prepTimeMin} min · preferencja {dish.preference}/5
        </div>
      )}
    </button>
  );
}
