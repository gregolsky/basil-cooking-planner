import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Dish, MeatType } from '../types/dish';
import { useAppStore } from '../store/useAppStore';

const MEAT_EMOJI: Record<MeatType, string> = {
  beef: '🐄',
  pork: '🐷',
  poultry: '🐔',
  fish: '🐟',
  none: '🥦',
};

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
            <div style={{ fontWeight: 600, color: 'var(--color-red-dark)', fontSize: '1.05rem' }}>
              {d.name}
            </div>
            {d.tags.length > 0 && (
              <div className="row" style={{ marginTop: 4 }}>
                {d.tags.map((tid) => (
                  <span key={tid} className="badge gold">{tagMap.get(tid)?.name ?? tid}</span>
                ))}
              </div>
            )}
          </div>
          <span className="badge soft">{MEAT_EMOJI[d.meat]} {t(`meat.${d.meat}`)}</span>
          <span className="badge">{t('dishlist.difficulty', { n: d.difficulty })}</span>
          <span className="badge green">{t('dishlist.preference', { n: d.preference })}</span>
          <span className="badge soft">{t('dishlist.serves_other', { count: d.servesDays })}</span>
          <div className="row">
            <button className="small ghost" onClick={() => onEdit(d.id)}>{t('common.edit')}</button>
            <button className="small danger" onClick={() => onDelete(d.id)}>{t('common.delete')}</button>
          </div>
        </div>
      ))}
    </div>
  );
}
