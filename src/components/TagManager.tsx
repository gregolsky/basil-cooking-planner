import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { TagDefinition } from '../types/tag';
import { uid } from '../lib/utils/id';

export function TagManager() {
  const tagDefs = useAppStore((s) => s.tagDefinitions);
  const upsertTag = useAppStore((s) => s.upsertTag);
  const deleteTag = useAppStore((s) => s.deleteTag);

  const [draft, setDraft] = useState<TagDefinition>({ id: '', name: '' });

  const addTag = () => {
    const name = draft.name.trim();
    if (!name) return;
    upsertTag({
      id: draft.id || uid(),
      name,
      maxPerWeek: draft.maxPerWeek,
      minGapDays: draft.minGapDays,
    });
    setDraft({ id: '', name: '' });
  };

  const updateExisting = (tag: TagDefinition, patch: Partial<TagDefinition>) => {
    upsertTag({ ...tag, ...patch });
  };

  return (
    <div className="card stack">
      <h2>Etykiety</h2>
      <div className="muted" style={{ fontSize: 13 }}>
        Etykiety opisują dania (np. „niania może", „zamawiane", „wege"). Dzień kalendarza może wymagać konkretnej
        etykiety. Limity: max razy w tygodniu (np. niania 2×) lub minimalna przerwa w dniach
        (np. „zamawiane" co najmniej co 14 dni).
      </div>

      <div className="row">
        <input
          type="text"
          placeholder="Nazwa (np. niania)"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          className="grow"
        />
        <input
          type="number"
          placeholder="max/tydz."
          min={1}
          value={draft.maxPerWeek ?? ''}
          onChange={(e) => setDraft({ ...draft, maxPerWeek: e.target.value ? Number(e.target.value) : undefined })}
          style={{ width: 110 }}
        />
        <input
          type="number"
          placeholder="min przerwa (dni)"
          min={1}
          value={draft.minGapDays ?? ''}
          onChange={(e) => setDraft({ ...draft, minGapDays: e.target.value ? Number(e.target.value) : undefined })}
          style={{ width: 140 }}
        />
        <button onClick={addTag} disabled={!draft.name.trim()}>Dodaj</button>
      </div>

      {tagDefs.length === 0 && <div className="muted">Brak zdefiniowanych etykiet.</div>}

      <div className="stack">
        {tagDefs.map((t) => (
          <div key={t.id} className="row">
            <input
              type="text"
              value={t.name}
              onChange={(e) => updateExisting(t, { name: e.target.value })}
              className="grow"
            />
            <label className="row" style={{ gap: 4 }}>
              <span className="muted" style={{ fontSize: 12 }}>max/tydz.</span>
              <input
                type="number"
                min={1}
                value={t.maxPerWeek ?? ''}
                onChange={(e) =>
                  updateExisting(t, { maxPerWeek: e.target.value ? Number(e.target.value) : undefined })
                }
                style={{ width: 70 }}
              />
            </label>
            <label className="row" style={{ gap: 4 }}>
              <span className="muted" style={{ fontSize: 12 }}>min przerwa</span>
              <input
                type="number"
                min={1}
                value={t.minGapDays ?? ''}
                onChange={(e) =>
                  updateExisting(t, { minGapDays: e.target.value ? Number(e.target.value) : undefined })
                }
                style={{ width: 70 }}
              />
            </label>
            <button className="small danger" onClick={() => {
              if (confirm(`Usunąć etykietę „${t.name}"? Zostanie odłączona od wszystkich dań.`)) deleteTag(t.id);
            }}>Usuń</button>
          </div>
        ))}
      </div>
    </div>
  );
}
