import type { PlannedMeal } from '../types/plan';
import type { Dish, MeatType } from '../types/dish';
import type { DayContext } from '../lib/days/capacity';
import type { TagDefinition } from '../types/tag';
import { formatShortPl, weekdayShortPl, isWeekend } from '../lib/utils/date';

const MEAT_EMOJI: Record<MeatType, string> = {
  beef: '🐄',
  pork: '🐷',
  poultry: '🐔',
  fish: '🐟',
  none: '🥦',
};

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
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="day-weekday">{weekdayShortPl(day.date)}</div>
          <div className="day-date">{formatShortPl(day.date)}</div>
        </div>
        <div className="day-meta no-print">
          {meal.locked && <span className="badge">📌</span>}
          {day.requiresTags.map((t) => (
            <span key={t} className="badge gold">{tagMap.get(t)?.name ?? t}</span>
          ))}
        </div>
      </div>
      <div className="day-dish" style={{ flexGrow: 1 }}>
        {day.skip
          ? <span className="muted">(nie gotujemy)</span>
          : dish
            ? <>{dish.name} {MEAT_EMOJI[dish.meat]}</>
            : <span className="muted">—</span>}
      </div>
      <div className="no-print" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {meal.isLeftover && <div><span className="badge soft">resztki</span></div>}
        <div className="muted" style={{ fontSize: 11 }}>limit: {day.difficultyCap}</div>
      </div>
    </button>
  );
}
