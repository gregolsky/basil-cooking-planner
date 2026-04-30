import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import type { TagDefinition } from '../types/tag';
import { uid } from '../lib/utils/id';

export function TagManager() {
  const { t } = useTranslation();
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
      <h2>{t('tags.title')}</h2>
      <div className="muted" style={{ fontSize: 13 }}>
        {t('tags.desc')}
      </div>

      <div className="row" style={{ flexWrap: 'wrap', gap: 8, alignItems: 'flex-start' }}>
        <input
          type="text"
          placeholder={t('tags.namePlaceholder')}
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          className="grow"
        />
        <div className="stack" style={{ gap: 2 }}>
          <input
            type="number"
            placeholder={t('tags.maxPerWeekPlaceholder')}
            min={1}
            value={draft.maxPerWeek ?? ''}
            onChange={(e) => setDraft({ ...draft, maxPerWeek: e.target.value ? Number(e.target.value) : undefined })}
            style={{ width: 110 }}
          />
          <span className="muted" style={{ fontSize: 11 }}>{t('tags.maxPerWeekHint')}</span>
        </div>
        <div className="stack" style={{ gap: 2 }}>
          <input
            type="number"
            placeholder={t('tags.minGapPlaceholder')}
            min={1}
            value={draft.minGapDays ?? ''}
            onChange={(e) => setDraft({ ...draft, minGapDays: e.target.value ? Number(e.target.value) : undefined })}
            style={{ width: 140 }}
          />
          <span className="muted" style={{ fontSize: 11 }}>{t('tags.minGapHint')}</span>
        </div>
        <button onClick={addTag} disabled={!draft.name.trim()}>{t('tags.add')}</button>
      </div>

      {tagDefs.length === 0 && <div className="muted">{t('tags.noTags')}</div>}

      <div className="stack">
        {tagDefs.map((tag) => (
          <div key={tag.id} className="row">
            <input
              type="text"
              value={tag.name}
              onChange={(e) => updateExisting(tag, { name: e.target.value })}
              className="grow"
            />
            <label className="row" style={{ gap: 4 }}>
              <span className="muted" style={{ fontSize: 12 }}>{t('tags.maxPerWeekLabel')}</span>
              <input
                type="number"
                min={1}
                value={tag.maxPerWeek ?? ''}
                onChange={(e) =>
                  updateExisting(tag, { maxPerWeek: e.target.value ? Number(e.target.value) : undefined })
                }
                style={{ width: 70 }}
              />
            </label>
            <label className="row" style={{ gap: 4 }}>
              <span className="muted" style={{ fontSize: 12 }}>{t('tags.minGapLabel')}</span>
              <input
                type="number"
                min={1}
                value={tag.minGapDays ?? ''}
                onChange={(e) =>
                  updateExisting(tag, { minGapDays: e.target.value ? Number(e.target.value) : undefined })
                }
                style={{ width: 70 }}
              />
            </label>
            <button className="small danger" onClick={() => {
              if (confirm(t('tags.confirmDelete', { name: tag.name }))) deleteTag(tag.id);
            }}>{t('common.delete')}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
