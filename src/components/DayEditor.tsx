import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import type { Dish, MeatType } from '../types/dish';
import { formatDateLocale, weekdayLocale } from '../lib/utils/date';
import { evaluatePlan } from '../lib/plan/evaluate';
import { TagPicker } from './TagPicker';

interface Props {
  planId: string;
  date: string;
  onClose: () => void;
}

export function DayEditor({ planId, date, onClose }: Props) {
  const plan = useAppStore((s) => s.plans.find((p) => p.id === planId));
  const dishes = useAppStore((s) => s.dishes);
  const dayModifiers = useAppStore((s) => s.dayModifiers);
  const tagDefs = useAppStore((s) => s.tagDefinitions);
  const replaceMeal = useAppStore((s) => s.replaceMeal);
  const updatePlan = useAppStore((s) => s.updatePlan);
  const upsertDayModifier = useAppStore((s) => s.upsertDayModifier);

  const meal = plan?.meals.find((m) => m.date === date);
  const modifier = dayModifiers.find((m) => m.date === date);

  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [meatFilter, setMeatFilter] = useState<MeatType | 'all'>('all');
  const [tagFilter, setTagFilter] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dishes.filter((d) => {
      if (q && !d.name.toLowerCase().includes(q)) return false;
      if (meatFilter !== 'all' && d.meat !== meatFilter) return false;
      for (const t of tagFilter) if (!d.tags.includes(t)) return false;
      return true;
    });
  }, [dishes, query, meatFilter, tagFilter]);

  if (!plan || !meal) return null;

  const reevaluate = () => {
    updatePlan(planId, (p) => {
      const { fitness, violations } = evaluatePlan(p, dishes, dayModifiers, tagDefs);
      return { ...p, fitness, violations };
    });
  };

  const pinDish = (dish: Dish) => {
    replaceMeal(planId, date, {
      date,
      dishId: dish.id,
      isLeftover: false,
      locked: true,
    });
    reevaluate();
  };

  const unpin = () => {
    replaceMeal(planId, date, { ...meal, locked: false });
    reevaluate();
  };

  const setSkip = (on: boolean) => {
    if (on) {
      replaceMeal(planId, date, { date, dishId: null, isLeftover: false, locked: true });
      upsertDayModifier({ ...(modifier ?? { date }), date, skip: true });
    } else {
      upsertDayModifier({ ...(modifier ?? { date }), date, skip: false });
    }
    reevaluate();
  };

  const currentDish = meal.dishId ? dishes.find((d) => d.id === meal.dishId) : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>{formatDateLocale(date, i18n.language)} — {weekdayLocale(date, i18n.language)}</h2>
          <div className="spacer" />
          <button className="ghost small" aria-label={t('dayeditor.closeLabel')} onClick={onClose}>×</button>
        </div>

        <div className="stack">
          <div>
            <strong>{t('dayeditor.currently')}</strong>{' '}
            {meal.isLeftover
              ? <>{t('dayeditor.leftoverFrom', { date: meal.sourceDate, dish: currentDish?.name ?? '…' })}</>
              : currentDish
                ? <>{currentDish.name} {meal.locked && <span className="badge">{t('dayeditor.pinned')}</span>}</>
                : <em className="muted">{t('dayeditor.noDish')}</em>}
          </div>

          <div className="row">
            {meal.locked && <button className="ghost small" onClick={unpin}>{t('dayeditor.unpin')}</button>}
            <label className="row" style={{ gap: 6 }}>
              <input
                type="checkbox"
                checked={modifier?.skip ?? false}
                onChange={(e) => setSkip(e.target.checked)}
              />
              {t('dayeditor.skipLabel')}
            </label>
          </div>

          {tagDefs.length > 0 && (
            <div>
              <strong>{t('dayeditor.requiredTags')}</strong>
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>{t('dayeditor.requiredTagsHint')}</div>
              <TagPicker
                tagDefs={tagDefs}
                selected={modifier?.requiresTags ?? []}
                onChange={(tags) => {
                  upsertDayModifier({ ...(modifier ?? { date }), date, requiresTags: tags });
                  reevaluate();
                }}
              />
            </div>
          )}

          <hr style={{ width: '100%', border: 'none', borderTop: '1px dashed #c7b79d' }} />

          <h3 style={{ margin: 0 }}>{t('dayeditor.pinTitle')}</h3>
          <div className="row">
            <input
              type="text"
              placeholder={t('dayeditor.searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="grow"
            />
            <select value={meatFilter} onChange={(e) => setMeatFilter(e.target.value as MeatType | 'all')}>
              <option value="all">{t('meat.all')}</option>
              {(['beef', 'pork', 'poultry', 'fish', 'none'] as MeatType[]).map((m) => (
                <option key={m} value={m}>{t(`meat.${m}`)}</option>
              ))}
            </select>
          </div>
          {tagDefs.length > 0 && (
            <TagPicker tagDefs={tagDefs} selected={tagFilter} onChange={setTagFilter} />
          )}
          <div className="stack" style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtered.length === 0 && <div className="muted">{t('dayeditor.noMatches')}</div>}
            {filtered.map((d) => (
              <button
                key={d.id}
                type="button"
                className="ghost"
                style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                onClick={() => pinDish(d)}
              >
                <strong>{d.name}</strong> · {t(`meat.${d.meat}`)} · {t('dishlist.difficulty', { n: d.difficulty })}
              </button>
            ))}
          </div>

          <div className="row">
            <div className="spacer" />
            <button onClick={onClose}>{t('common.close')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
