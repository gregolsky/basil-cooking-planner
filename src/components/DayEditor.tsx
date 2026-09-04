import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Pin } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { Dish, MeatType } from '../types/dish';
import type { DayModifier } from '../types/day';
import { formatDateLocale, weekdayLocale } from '../lib/utils/date';
import { evaluatePlan } from '../lib/plan/evaluate';
import { useDismiss } from '../hooks/useDismiss';
import { TagPicker } from './TagPicker';
import { DifficultyBar } from './DifficultyBar';
import { MeatIcon } from './MeatIcon';

interface Props {
  planId: string;
  date: string;
  onClose: () => void;
}

export function DayEditor({ planId, date, onClose }: Props) {
  const plan = useAppStore((s) => s.plans.find((p) => p.id === planId));
  const dishes = useAppStore((s) => s.dishes);
  const tagDefs = useAppStore((s) => s.tagDefinitions);
  const replaceMeal = useAppStore((s) => s.replaceMeal);
  const updatePlan = useAppStore((s) => s.updatePlan);
  const sameMeatPenalty = useAppStore((s) => s.sameMeatPenalty);

  const meal = plan?.meals.find((m) => m.date === date);
  const modifier = (plan?.dayModifiers ?? []).find((m) => m.date === date);

  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [meatFilter, setMeatFilter] = useState<MeatType | 'all'>('all');
  const [tagFilter, setTagFilter] = useState<string[]>([]);

  useDismiss({ onDismiss: onClose, active: true });

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

  const upsertModifier = (patch: Partial<DayModifier>) => {
    updatePlan(planId, (p) => {
      const mods = p.dayModifiers ?? [];
      const idx = mods.findIndex((m) => m.date === date);
      const existing = idx >= 0 ? mods[idx] : { date };
      const next = { ...existing, ...patch };
      const isEmpty = next.difficultyCap === undefined && !next.skip && !next.requiresTags?.length && !next.note;
      let newMods: DayModifier[];
      if (isEmpty) {
        newMods = mods.filter((_, i) => i !== idx);
      } else if (idx >= 0) {
        newMods = mods.slice();
        newMods[idx] = next as DayModifier;
      } else {
        newMods = [...mods, next as DayModifier];
      }
      return { ...p, dayModifiers: newMods };
    });
  };

  const reevaluate = () => {
    updatePlan(planId, (p) => {
      const { fitness, violations } = evaluatePlan(p, dishes, p.dayModifiers ?? [], tagDefs, { sameMeatPenalty });
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
  };

  const setSkip = (on: boolean) => {
    if (on) {
      replaceMeal(planId, date, { date, dishId: null, isLeftover: false, locked: true });
    }
    upsertModifier({ skip: on });
    reevaluate();
  };

  const currentDish = meal.dishId ? dishes.find((d) => d.id === meal.dishId) : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>{formatDateLocale(date, i18n.language)} — {weekdayLocale(date, i18n.language)}</h2>
          <div className="spacer" />
          <button className="icon-btn" aria-label={t('dayeditor.closeLabel')} onClick={onClose}><X size={18} /></button>
        </div>

        <div className="stack">
          <div className="row" style={{ alignItems: 'center' }}>
            <div className="grow">
              <strong>{t('dayeditor.currently')}</strong>{' '}
              {meal.isLeftover
                ? <>{t('dayeditor.leftoverFrom', { date: meal.sourceDate, dish: currentDish?.name ?? '…' })}</>
                : currentDish
                  ? <>{currentDish.name} {meal.locked && (
                      <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <Pin size={11} /> {t('dayeditor.pinned')}
                      </span>
                    )}</>
                  : <em className="muted">{t('dayeditor.noDish')}</em>}
            </div>
            {meal.locked && <button className="ghost small" onClick={unpin}>{t('dayeditor.unpin')}</button>}
          </div>

          <h2 style={{ margin: '4px 0 0' }}>{t('dayeditor.pinTitle')}</h2>
          <div className="dish-picker">
            <div className="dish-picker-search">
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
            </div>
            <div className="dish-picker-list">
              {filtered.length === 0 && <div className="muted" style={{ padding: '8px 10px' }}>{t('dayeditor.noMatches')}</div>}
              {filtered.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="dish-option"
                  onClick={() => pinDish(d)}
                >
                  <span className="name">{d.name}</span>
                  <MeatIcon meat={d.meat} label={t(`meat.${d.meat}`)} />
                  <DifficultyBar value={d.difficulty} capacity={5} label={t('dishlist.difficulty', { n: d.difficulty })} />
                </button>
              ))}
            </div>
          </div>

          <details className="day-settings">
            <summary>{t('dayeditor.daySettings')}</summary>
            <div className="stack" style={{ marginTop: 10 }}>
              <label className="row" style={{ gap: 6 }}>
                <input
                  type="checkbox"
                  checked={modifier?.skip ?? false}
                  onChange={(e) => setSkip(e.target.checked)}
                />
                {t('dayeditor.skipLabel')}
              </label>

              {tagDefs.length > 0 && (
                <div>
                  <strong>{t('dayeditor.requiredTags')}</strong>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>{t('dayeditor.requiredTagsHint')}</div>
                  <TagPicker
                    tagDefs={tagDefs}
                    selected={modifier?.requiresTags ?? []}
                    onChange={(tags) => {
                      upsertModifier({ requiresTags: tags });
                      reevaluate();
                    }}
                  />
                </div>
              )}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
