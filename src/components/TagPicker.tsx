import { useTranslation } from 'react-i18next';
import type { TagDefinition } from '../types/tag';

interface Props {
  tagDefs: TagDefinition[];
  selected: string[];
  onChange: (next: string[]) => void;
  emptyHint?: string;
}

export function TagPicker({ tagDefs, selected, onChange, emptyHint }: Props) {
  const { t } = useTranslation();
  if (tagDefs.length === 0) {
    return <div className="muted">{emptyHint ?? t('tags.noTags')}</div>;
  }
  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter((t) => t !== id));
    else onChange([...selected, id]);
  };
  return (
    <div className="row">
      {tagDefs.map((t) => {
        const active = selected.includes(t.id);
        return (
          <button
            key={t.id}
            type="button"
            className={active ? 'tag-active' : 'tag-inactive'}
            onClick={() => toggle(t.id)}
          >
            {active ? `✓ ${t.name} ×` : t.name}
          </button>
        );
      })}
    </div>
  );
}
