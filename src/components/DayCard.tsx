import { useTranslation } from 'react-i18next';
import type { PlannedMeal } from '../types/plan';
import type { Dish } from '../types/dish';
import type { DayContext } from '../lib/days/capacity';
import type { TagDefinition } from '../types/tag';
import { formatShortDateLocale, weekdayShortLocale, isWeekend } from '../lib/utils/date';
import { MEAT_EMOJI } from '../lib/utils/meat';
import { DifficultyBar } from './DifficultyBar';

interface Props {
  meal: PlannedMeal;
  day: DayContext;
  dish: Dish | null;
  tagMap: Map<string, TagDefinition>;
  monthStart?: boolean;
  isPast?: boolean;
  onClick: () => void;
  onTogglePin: () => void;
}

export function DayCard({ meal, day, dish, tagMap, monthStart, isPast, onClick, onTogglePin }: Props) {
  const { t, i18n } = useTranslation();
  const weekend = isWeekend(day.date);
  const overCap = !!dish && !meal.isLeftover && !day.skip && dish.difficulty > day.difficultyCap;
  const classes = [
    'menu-card',
    'day-card',
    weekend ? 'weekend' : '',
    day.skip ? 'skip' : '',
    meal.locked ? 'locked' : '',
    monthStart ? 'month-start' : '',
    isPast ? 'past' : '',
    overCap ? 'over-cap' : '',
  ].filter(Boolean).join(' ');

  const dateLabel = `${weekdayShortLocale(day.date, i18n.language)} ${formatShortDateLocale(day.date, i18n.language)}`;
  const pinDisabled = !meal.dishId || meal.isLeftover || day.skip || !!isPast;

  return (
    <div className={classes}>
      <button
        type="button"
        className="day-card-open"
        aria-label={t('daycard.openLabel', { date: dateLabel })}
        onClick={onClick}
      />
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="day-weekday">{weekdayShortLocale(day.date, i18n.language)}</div>
          <div className="day-date">{formatShortDateLocale(day.date, i18n.language)}</div>
        </div>
        <div className="day-meta no-print">
          {overCap && dish && (
            <span
              className="badge over-cap-badge"
              title={t('daycard.overCap', { difficulty: dish.difficulty, cap: day.difficultyCap })}
            >⚠ {dish.difficulty}/{day.difficultyCap}</span>
          )}
          <button
            type="button"
            className="icon-btn day-pin"
            aria-pressed={meal.locked}
            aria-label={t(meal.locked ? 'daycard.unpin' : 'daycard.pin')}
            disabled={pinDisabled}
            onClick={onTogglePin}
          >📌</button>
          {day.requiresTags.map((t) => (
            <span key={t} className="badge gold">{tagMap.get(t)?.name ?? t}</span>
          ))}
        </div>
      </div>
      <div className="day-dish" style={{ flexGrow: 1 }}>
        {day.skip
          ? <span className="muted">{t('daycard.skip')}</span>
          : dish
            ? <>{dish.name} {MEAT_EMOJI[dish.meat]}</>
            : <span className="muted">—</span>}
      </div>
      <div className="no-print" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {meal.isLeftover && <div><span className="badge soft">{t('daycard.leftover')}</span></div>}
        <div className="muted" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          {t('daycard.limitLabel')}
          <DifficultyBar value={day.difficultyCap} label={t('daycard.difficultyLimit', { cap: day.difficultyCap })} />
        </div>
      </div>
    </div>
  );
}
