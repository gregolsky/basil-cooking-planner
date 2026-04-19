import { useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { Dish, MeatType } from '../types/dish';
import { MEAT_LABELS } from '../types/dish';
import { formatPl, weekdayPl } from '../lib/utils/date';
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
        <h2>{formatPl(date)} — {weekdayPl(date)}</h2>

        <div className="stack">
          <div>
            <strong>Aktualnie:</strong>{' '}
            {meal.isLeftover
              ? <>resztki z {meal.sourceDate} — {currentDish?.name ?? '…'}</>
              : currentDish
                ? <>{currentDish.name} {meal.locked && <span className="badge">📌 przypięte</span>}</>
                : <em className="muted">brak / nie gotujemy</em>}
          </div>

          <div className="row">
            {meal.locked && <button className="ghost small" onClick={unpin}>Odepnij</button>}
            <label className="row" style={{ gap: 6 }}>
              <input
                type="checkbox"
                checked={modifier?.skip ?? false}
                onChange={(e) => setSkip(e.target.checked)}
              />
              Nie gotujemy
            </label>
          </div>

          <hr style={{ width: '100%', border: 'none', borderTop: '1px dashed #c7b79d' }} />

          <h3 style={{ margin: 0 }}>Przypnij obiad</h3>
          <div className="row">
            <input
              type="text"
              placeholder="Szukaj…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="grow"
            />
            <select value={meatFilter} onChange={(e) => setMeatFilter(e.target.value as MeatType | 'all')}>
              <option value="all">wszystkie mięsa</option>
              {(Object.keys(MEAT_LABELS) as MeatType[]).map((m) => (
                <option key={m} value={m}>{MEAT_LABELS[m]}</option>
              ))}
            </select>
          </div>
          {tagDefs.length > 0 && (
            <TagPicker tagDefs={tagDefs} selected={tagFilter} onChange={setTagFilter} />
          )}
          <div className="stack" style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtered.length === 0 && <div className="muted">Brak pasujących dań.</div>}
            {filtered.map((d) => (
              <button
                key={d.id}
                type="button"
                className="ghost"
                style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                onClick={() => pinDish(d)}
              >
                <strong>{d.name}</strong> · {MEAT_LABELS[d.meat]} · trudność {d.difficulty}
              </button>
            ))}
          </div>

          <div className="row">
            <div className="spacer" />
            <button onClick={onClose}>Gotowe</button>
          </div>
        </div>
      </div>
    </div>
  );
}
