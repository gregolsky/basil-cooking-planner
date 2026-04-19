import { useEffect, useState } from 'react';
import type { Dish, MeatType } from '../types/dish';
import { MEAT_LABELS } from '../types/dish';
import { useAppStore } from '../store/useAppStore';
import { uid } from '../lib/utils/id';
import { TagPicker } from './TagPicker';

interface Props {
  initial?: Dish;
  onSubmit: (dish: Dish) => void;
  onCancel: () => void;
}

const EMPTY: Dish = {
  id: '',
  name: '',
  meat: 'none',
  difficulty: 2,
  preference: 3,
  tags: [],
  servesDays: 1,
};

export function DishForm({ initial, onSubmit, onCancel }: Props) {
  const tagDefs = useAppStore((s) => s.tagDefinitions);
  const [form, setForm] = useState<Dish>(() => initial ?? { ...EMPTY });

  useEffect(() => {
    if (initial) setForm(initial);
  }, [initial]);

  const update = <K extends keyof Dish>(k: K, v: Dish[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit({ ...form, id: form.id || uid(), name: form.name.trim() });
  };

  return (
    <form onSubmit={submit} className="stack">
      <div className="dish-form-grid">
        <label>
          Nazwa dania
          <input
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            required
            autoFocus
          />
        </label>

        <label>
          Rodzaj mięsa
          <select value={form.meat} onChange={(e) => update('meat', e.target.value as MeatType)}>
            {(Object.keys(MEAT_LABELS) as MeatType[]).map((m) => (
              <option key={m} value={m}>{MEAT_LABELS[m]}</option>
            ))}
          </select>
        </label>

        <label>
          Trudność (1-5)
          <select value={form.difficulty} onChange={(e) => update('difficulty', Number(e.target.value) as Dish['difficulty'])}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>

      <div className="dish-form-grid">
        <label>
          Preferencja (1-5)
          <select value={form.preference} onChange={(e) => update('preference', Number(e.target.value) as Dish['preference'])}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>

        <label>
          Starcza na
          <select value={form.servesDays} onChange={(e) => update('servesDays', Number(e.target.value) as Dish['servesDays'])}>
            <option value={1}>1 dzień</option>
            <option value={2}>2 dni</option>
            <option value={3}>3 dni</option>
          </select>
        </label>
      </div>

      <label>
        Etykiety
        <TagPicker
          tagDefs={tagDefs}
          selected={form.tags}
          onChange={(tags) => update('tags', tags)}
          emptyHint="Brak etykiet. Zdefiniuj je w Dane → Etykiety."
        />
      </label>

      <div className="row">
        <button type="button" className="ghost" onClick={onCancel}>Anuluj</button>
        <div className="spacer" />
        <button type="submit">Zapisz</button>
      </div>
    </form>
  );
}
