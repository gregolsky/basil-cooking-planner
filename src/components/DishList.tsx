import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Dish } from '../types/dish';
import { useAppStore } from '../store/useAppStore';
import { DifficultyBar } from './DifficultyBar';
import { MeatIcon } from './MeatIcon';

interface Props {
  dishes: Dish[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function DishList({ dishes, onEdit, onDelete }: Props) {
  const { t } = useTranslation();
  const tagDefs = useAppStore((s) => s.tagDefinitions);
  const tagMap = useMemo(() => new Map(tagDefs.map((td) => [td.id, td])), [tagDefs]);

  if (dishes.length === 0) {
    return (
      <div className="empty-state card">
        <div>{t('dishlist.empty')}</div>
        <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>{t('dishlist.emptyHint')}</div>
      </div>
    );
  }
  return (
    <div className="stack">
      {dishes.map((d) => (
        <div key={d.id} className="dish-row">
          <div>
            <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '1.05rem' }}>
              {d.name}
            </div>
            {d.tags.length > 0 && (
              <div className="row" style={{ marginTop: 4 }}>
                {d.tags.map((tid) => (
                  <span key={tid} className="badge soft">{tagMap.get(tid)?.name ?? tid}</span>
                ))}
              </div>
            )}
          </div>
          <div className="row dish-row-meta">
            <span className="row" style={{ gap: 4, alignItems: 'center' }}>
              <MeatIcon meat={d.meat} size={14} /> {t(`meat.${d.meat}`)}
            </span>
            <span className="dish-row-dot" aria-hidden="true">·</span>
            <DifficultyBar value={d.difficulty} capacity={5} label={t('dishlist.difficulty', { n: d.difficulty })} />
            <span className="dish-row-dot" aria-hidden="true">·</span>
            <span>{t('dishlist.preference', { n: d.preference })}</span>
            <span className="dish-row-dot" aria-hidden="true">·</span>
            <span>{t('dishlist.serves_other', { count: d.servesDays })}</span>
          </div>
          <div className="row">
            <button className="small" onClick={() => onEdit(d.id)}>{t('common.edit')}</button>
            <button className="small danger" onClick={() => onDelete(d.id)}>{t('common.delete')}</button>
          </div>
        </div>
      ))}
    </div>
  );
}
