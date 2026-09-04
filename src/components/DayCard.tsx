import { useTranslation } from 'react-i18next';
import { Pin } from 'lucide-react';
import type { PlannedMeal } from '../types/plan';
import type { Dish } from '../types/dish';
import type { DayContext } from '../lib/days/capacity';
import type { TagDefinition } from '../types/tag';
import { formatShortDateLocale, weekdayShortLocale, isWeekend } from '../lib/utils/date';
import { isPinDisabled, cookedDifficulty as computeCookedDifficulty } from '../lib/plan/dayCard';
import { DifficultyBar } from './DifficultyBar';
import { MeatIcon } from './MeatIcon';

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
  const classes = [
    'menu-card',
    'day-card',
    weekend ? 'weekend' : '',
    day.skip ? 'skip' : '',
    meal.locked ? 'locked' : '',
    monthStart ? 'month-start' : '',
    isPast ? 'past' : '',
  ].filter(Boolean).join(' ');

  const dateLabel = `${weekdayShortLocale(day.date, i18n.language)} ${formatShortDateLocale(day.date, i18n.language)}`;
  const dishSummary = day.skip ? t('daycard.skip') : dish ? dish.name : '—';
  const pinDisabled = isPinDisabled(meal, day, !!isPast);
  const difficulty = computeCookedDifficulty(meal, dish?.difficulty);

  return (
    <div
      className={classes}
      role="button"
      tabIndex={0}
      aria-label={t('daycard.openLabel', { date: dateLabel, dish: dishSummary })}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="day-weekday">{weekdayShortLocale(day.date, i18n.language)}</div>
          <div className="day-date">{formatShortDateLocale(day.date, i18n.language)}</div>
        </div>
        <div className="day-meta no-print">
          <button
            type="button"
            className="icon-btn day-pin"
            aria-pressed={meal.locked}
            aria-label={t(meal.locked ? 'daycard.unpin' : 'daycard.pin')}
            disabled={pinDisabled}
            onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
          ><Pin size={15} /></button>
          {day.requiresTags.map((t) => (
            <span key={t} className="badge gold">{tagMap.get(t)?.name ?? t}</span>
          ))}
        </div>
      </div>
      <div className="day-dish" style={{ flexGrow: 1 }}>
        {day.skip
          ? <span className="muted">{t('daycard.skip')}</span>
          : dish
            ? <>{dish.name} <MeatIcon meat={dish.meat} /></>
            : <span className="muted">—</span>}
      </div>
      <div className="no-print" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {meal.isLeftover && <div><span className="badge soft">{t('daycard.leftover')}</span></div>}
        <div className="muted" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          {t('daycard.limitLabel')}
          <DifficultyBar
            value={difficulty}
            capacity={day.difficultyCap}
            label={t('daycard.difficultyLimit', { difficulty, cap: day.difficultyCap })}
          />
        </div>
      </div>
    </div>
  );
}
