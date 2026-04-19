import type { Dish, MeatType } from '../types/dish';
import { MEAT_LABELS } from '../types/dish';

const MEAT_EMOJI: Record<MeatType, string> = {
  beef: '🐄',
  pork: '🐷',
  poultry: '🐔',
  fish: '🐟',
  none: '🥦',
};
import { useAppStore } from '../store/useAppStore';
import { useMemo } from 'react';

interface Props {
  dishes: Dish[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function DishList({ dishes, onEdit, onDelete }: Props) {
  const tagDefs = useAppStore((s) => s.tagDefinitions);
  const tagMap = useMemo(() => new Map(tagDefs.map((t) => [t.id, t])), [tagDefs]);

  if (dishes.length === 0) {
    return (
      <div className="empty-state card">
        Brak dań w bibliotece. Dodaj pierwsze danie, aby zacząć planowanie.
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
                {d.tags.map((t) => (
                  <span key={t} className="badge gold">{tagMap.get(t)?.name ?? t}</span>
                ))}
              </div>
            )}
          </div>
          <span className="badge soft">{MEAT_EMOJI[d.meat]} {MEAT_LABELS[d.meat]}</span>
          <span className="badge">trudność {d.difficulty}</span>
          <span className="badge green">preferencja {d.preference}/5</span>
          <span className="badge soft">{d.servesDays > 1 ? `${d.servesDays} dni` : '1 dzień'}</span>
          <div className="row">
            <button className="small ghost" onClick={() => onEdit(d.id)}>Edytuj</button>
            <button className="small danger" onClick={() => onDelete(d.id)}>Usuń</button>
          </div>
        </div>
      ))}
    </div>
  );
}
