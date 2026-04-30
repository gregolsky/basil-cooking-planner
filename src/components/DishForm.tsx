import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Dish, MeatType } from '../types/dish';
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
  const { t } = useTranslation();
  const tagDefs = useAppStore((s) => s.tagDefinitions);
  const [form, setForm] = useState<Dish>(() => initial ? { ...initial, tags: [...initial.tags] } : { ...EMPTY });

  useEffect(() => {
    if (initial) setForm({ ...initial, tags: [...initial.tags] });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.id]);

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
          {t('dishform.name')}
          <input
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            required
            autoFocus
          />
        </label>

        <label>
          {t('dishform.meatType')}
          <select value={form.meat} onChange={(e) => update('meat', e.target.value as MeatType)}>
            {(['beef', 'pork', 'poultry', 'fish', 'none'] as MeatType[]).map((m) => (
              <option key={m} value={m}>{t(`meat.${m}`)}</option>
            ))}
          </select>
          <span className="muted" style={{ fontSize: 12 }}>{t('dishform.meatTypeHint')}</span>
        </label>

        <label>
          {t('dishform.difficulty')}
          <select value={form.difficulty} onChange={(e) => update('difficulty', Number(e.target.value) as Dish['difficulty'])}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="muted" style={{ fontSize: 12 }}>{t('dishform.difficultyHint')}</span>
        </label>
      </div>

      <div className="dish-form-grid">
        <label>
          {t('dishform.preference')}
          <select value={form.preference} onChange={(e) => update('preference', Number(e.target.value) as Dish['preference'])}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="muted" style={{ fontSize: 12 }}>{t('dishform.preferenceHint')}</span>
        </label>

        <label>
          {t('dishform.servesDays')}
          <select value={form.servesDays} onChange={(e) => update('servesDays', Number(e.target.value) as Dish['servesDays'])}>
            <option value={1}>{t('dishform.serves_1')}</option>
            <option value={2}>{t('dishform.serves_2')}</option>
            <option value={3}>{t('dishform.serves_3')}</option>
          </select>
          <span className="muted" style={{ fontSize: 12 }}>{t('dishform.servesDaysHint')}</span>
        </label>
      </div>

      <label>
        {t('dishform.tags')}
        <TagPicker
          tagDefs={tagDefs}
          selected={form.tags}
          onChange={(tags) => update('tags', tags)}
          emptyHint={t('dishform.noTagsHint')}
        />
      </label>

      <div className="row">
        <button type="button" className="ghost" onClick={onCancel}>{t('common.cancel')}</button>
        <div className="spacer" />
        <button type="submit">{t('common.save')}</button>
      </div>
    </form>
  );
}
